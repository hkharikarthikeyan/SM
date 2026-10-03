import os
import jwt
import time
import threading
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

from db import get_db

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'grocerry-supermarket-secret-key-2026')

CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global Exception Handler with CORS
@app.errorhandler(Exception)
def handle_exception(e):
    print(f"Server Error in FGM-Supermarket Backend: {e}")
    response = jsonify({
        'success': False,
        'message': str(e),
        'error': 'SERVER_ERROR'
    })
    response.status_code = 500
    return response

# Helper function to convert Mongo BSON object to JSON-serializable dict
def fmt_doc(doc):
    if not doc:
        return None
    doc = dict(doc)
    if '_id' in doc:
        doc['id'] = str(doc.pop('_id'))
    return doc

# Authentication Decorator for Supermarket Staff
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'success': False, 'message': 'Authentication token is missing', 'error': 'UNAUTHORIZED'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            db = get_db()
            current_user = db.users.find_one({'_id': ObjectId(data['id'])})
            
            if not current_user or current_user.get('role') != 'SUPERMARKET_ADMIN':
                return jsonify({'success': False, 'message': 'Supermarket Admin access required', 'error': 'FORBIDDEN'}), 403
            
            current_user = fmt_doc(current_user)
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired', 'error': 'TOKEN_EXPIRED'}), 401
        except Exception:
            return jsonify({'success': False, 'message': 'Invalid authentication token', 'error': 'INVALID_TOKEN'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# --- HEALTH CHECK ---
@app.route('/api/supermarket/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'message': 'Supermarket Portal Backend connected to MongoDB Atlas on port 5001!',
        'timestamp': datetime.utcnow().isoformat()
    })


# --- SUPERMARKET REGISTRATION ---
@app.route('/api/supermarket/auth/register', methods=['POST'])
def supermarket_register():
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        state = data.get('state', 'Tamil Nadu').strip()
        district = data.get('district', 'Dharmapuri').strip()
        address = data.get('address', 'Main Road').strip()
        contact_number = data.get('contact_number', '').strip()

        if not name or not username or not password:
            return jsonify({'success': False, 'message': 'Supermarket name, username, and password are required', 'error': 'MISSING_FIELDS'}), 400

        if len(username) < 3 or len(password) < 6:
            return jsonify({'success': False, 'message': 'Username must be at least 3 chars and password at least 6 chars', 'error': 'INVALID_INPUT'}), 400

        db = get_db()

        # Check duplicate username
        if db.users.find_one({'username': username}):
            return jsonify({'success': False, 'message': 'Username is already taken', 'error': 'DUPLICATE_USERNAME'}), 400

        now_iso = datetime.utcnow().isoformat()

        # 1. Create Supermarket document
        sm_doc = {
            'name': name,
            'address': address,
            'state': state,
            'district': district,
            'contact_number': contact_number,
            'status': 'ACTIVE',
            'created_at': now_iso
        }
        sm_res = db.supermarkets.insert_one(sm_doc)
        sm_doc = fmt_doc(sm_doc)

        # 2. Create Supermarket Admin user document
        user_doc = {
            'username': username,
            'name': f"{name} Staff",
            'email': f"{username}@supermarket.local",
            'password_hash': generate_password_hash(password),
            'role': 'SUPERMARKET_ADMIN',
            'state': state,
            'district': district,
            'supermarket_id': sm_doc['id'],
            'created_at': now_iso
        }
        user_res = db.users.insert_one(user_doc)
        user_doc = fmt_doc(user_doc)
        user_doc.pop('password_hash', None)

        # 3. Generate JWT Token
        payload = {
            'id': user_doc['id'],
            'username': username,
            'role': 'SUPERMARKET_ADMIN',
            'supermarket_id': sm_doc['id'],
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'success': True,
            'message': 'Supermarket registered successfully!',
            'token': token,
            'user': user_doc,
            'supermarket': sm_doc
        }), 201
    except Exception as e:
        print(f"Error registering supermarket: {e}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}', 'error': 'SERVER_ERROR'}), 500


# --- SUPERMARKET LOGIN ---
@app.route('/api/supermarket/auth/login', methods=['POST'])
def supermarket_login():
    try:
        data = request.get_json() or {}
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required', 'error': 'MISSING_CREDENTIALS'}), 400

        db = get_db()
        user = db.users.find_one({'username': username})
        
        if not user or not check_password_hash(user.get('password_hash', ''), password):
            return jsonify({'success': False, 'message': 'Invalid username or password', 'error': 'INVALID_CREDENTIALS'}), 401

        if user.get('role') != 'SUPERMARKET_ADMIN':
            return jsonify({'success': False, 'message': 'Access denied: Only Supermarket Staff can log in here', 'error': 'FORBIDDEN'}), 403

        user_data = fmt_doc(user)
        user_data.pop('password_hash', None)

        supermarket = None
        if user_data.get('supermarket_id'):
            try:
                sm = db.supermarkets.find_one({'_id': ObjectId(user_data['supermarket_id'])})
                supermarket = fmt_doc(sm)
            except Exception:
                supermarket = None

        payload = {
            'id': user_data['id'],
            'username': user_data['username'],
            'role': user_data['role'],
            'supermarket_id': user_data.get('supermarket_id'),
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'success': True,
            'message': 'Supermarket Staff Login Successful',
            'token': token,
            'user': user_data,
            'supermarket': supermarket
        })
    except Exception as e:
        print(f"Error logging in: {e}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}', 'error': 'SERVER_ERROR'}), 500

@app.route('/api/supermarket/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    db = get_db()
    supermarket = None
    if current_user.get('supermarket_id'):
        try:
            sm = db.supermarkets.find_one({'_id': ObjectId(current_user['supermarket_id'])})
            supermarket = fmt_doc(sm)
        except Exception:
            supermarket = None

    return jsonify({
        'success': True,
        'user': current_user,
        'supermarket': supermarket
    })


# --- ORDERS MANAGEMENT ---
@app.route('/api/supermarket/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    sm_id = current_user.get('supermarket_id')
    if not sm_id:
        return jsonify({'success': False, 'message': 'User is not assigned to a supermarket', 'error': 'NO_SUPERMARKET'}), 400

    db = get_db()
    orders_cursor = db.orders.find({'supermarket_id': str(sm_id)}).sort('created_at', -1)
    orders = [fmt_doc(o) for o in orders_cursor]

    return jsonify({
        'success': True,
        'orders': orders
    })

@app.route('/api/supermarket/orders/<order_id>/status', methods=['PATCH'])
@token_required
def update_status(current_user, order_id):
    db = get_db()
    try:
        order = db.orders.find_one({'_id': ObjectId(order_id)})
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid order ID', 'error': 'NOT_FOUND'}), 404

    if not order:
        return jsonify({'success': False, 'message': 'Order not found', 'error': 'NOT_FOUND'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    valid_statuses = ['PLACED', 'RECEIVED', 'PACKING', 'READY_FOR_PICKUP', 'COMPLETED']

    if new_status not in valid_statuses:
        return jsonify({'success': False, 'message': f'Invalid status. Allowed: {", ".join(valid_statuses)}', 'error': 'INVALID_STATUS'}), 400

    now_iso = datetime.utcnow().isoformat()
    db.orders.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'status': new_status, 'updated_at': now_iso}}
    )

    if new_status in ['COMPLETED', 'READY_FOR_PICKUP']:
        sm_name = order.get('supermarket_name', 'the supermarket')
        item_count = len(order.get('items', []))
        if new_status == 'COMPLETED':
            msg = f"🎉 Your order at {sm_name} is COMPLETED! Visit store to pay & collect your {item_count} item{'s' if item_count != 1 else ''}."
        else:
            msg = f"🛍️ Your order at {sm_name} is PACKED & READY FOR PICKUP! {item_count} item{'s' if item_count != 1 else ''} waiting. Pay at store upon collection."
        db.notifications.insert_one({
            'user_id': str(order['user_id']),
            'order_id': str(order['_id']),
            'message': msg,
            'is_read': False,
            'created_at': now_iso
        })

    updated_order = fmt_doc(db.orders.find_one({'_id': ObjectId(order_id)}))

    return jsonify({
        'success': True,
        'message': f'Order status updated to {new_status}',
        'order': updated_order
    })


# --- PRODUCT CATALOG MANAGEMENT (ADD / TOGGLE / FETCH PRODUCTS) ---
@app.route('/api/supermarket/products', methods=['GET'])
@token_required
def get_products(current_user):
    sm_id = current_user.get('supermarket_id')
    category = request.args.get('category')
    search = request.args.get('search')

    db = get_db()
    query = {'supermarket_id': str(sm_id)}

    if category and category != 'All':
        query['category'] = category

    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'category': {'$regex': search, '$options': 'i'}}
        ]

    products = [fmt_doc(p) for p in db.products.find(query).sort('name', 1)]
    categories = db.products.distinct('category', {'supermarket_id': str(sm_id)})

    return jsonify({
        'success': True,
        'categories': ['All'] + sorted(categories),
        'products': products
    })

# ADD PRODUCT API (Supermarket-Specific Creation)
@app.route('/api/supermarket/products', methods=['POST'])
@token_required
def add_product(current_user):
    sm_id = current_user.get('supermarket_id')
    if not sm_id:
        return jsonify({'success': False, 'message': 'User is not assigned to a supermarket', 'error': 'NO_SUPERMARKET'}), 400

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', 'General').strip()
    unit = data.get('unit', '1 Kg').strip()
    price = float(data.get('price', 0))
    stock_quantity = int(data.get('stock_quantity', 10))
    image_url = data.get('image_url', '').strip()

    if not name or price <= 0:
        return jsonify({'success': False, 'message': 'Product name and valid price are required', 'error': 'INVALID_PRODUCT'}), 400

    db = get_db()
    now_iso = datetime.utcnow().isoformat()

    product_doc = {
        'supermarket_id': str(sm_id),
        'name': name,
        'category': category,
        'unit': unit,
        'price': price,
        'stock_quantity': stock_quantity,
        'availability': stock_quantity > 0,
        'image_url': image_url or None,
        'created_at': now_iso,
        'updated_at': now_iso
    }

    res = db.products.insert_one(product_doc)
    product_doc = fmt_doc(product_doc)

    return jsonify({
        'success': True,
        'message': f'Product "{name}" added successfully to supermarket catalogue!',
        'product': product_doc
    }), 201

@app.route('/api/supermarket/products/<prod_id>', methods=['PATCH'])
@token_required
def toggle_product(current_user, prod_id):
    db = get_db()
    try:
        product = db.products.find_one({'_id': ObjectId(prod_id)})
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid product ID', 'error': 'NOT_FOUND'}), 404

    if not product:
        return jsonify({'success': False, 'message': 'Product not found', 'error': 'NOT_FOUND'}), 404

    data = request.get_json() or {}
    update_fields = {'updated_at': datetime.utcnow().isoformat()}

    if 'availability' in data:
        update_fields['availability'] = bool(data['availability'])
    if 'stock_quantity' in data:
        update_fields['stock_quantity'] = int(data['stock_quantity'])
        if update_fields['stock_quantity'] <= 0:
            update_fields['availability'] = False

    db.products.update_one({'_id': ObjectId(prod_id)}, {'$set': update_fields})
    updated = fmt_doc(db.products.find_one({'_id': ObjectId(prod_id)}))

    return jsonify({
        'success': True,
        'message': 'Product updated successfully',
        'product': updated
    })


# ─── BACKGROUND: Reminder notifications every 5 hours for READY_FOR_PICKUP orders ───
REMINDER_CHECK_INTERVAL = 30 * 60  # check every 30 minutes (in seconds)
REMINDER_GAP_HOURS = 5             # re-notify every 5 hours

def pickup_reminder_loop():
    """Background thread: sends reminder notifications for READY_FOR_PICKUP orders
    that haven't been notified in the last 5 hours. Runs until the process exits."""
    while True:
        try:
            time.sleep(REMINDER_CHECK_INTERVAL)
            db = get_db()
            cutoff = (datetime.utcnow() - timedelta(hours=REMINDER_GAP_HOURS)).isoformat()

            # Find all orders still in READY_FOR_PICKUP
            ready_orders = list(db.orders.find({'status': 'READY_FOR_PICKUP'}))

            for order in ready_orders:
                order_id_str = str(order['_id'])
                user_id = str(order.get('user_id', ''))
                sm_name = order.get('supermarket_name', 'the supermarket')
                item_count = len(order.get('items', []))

                # Check the latest notification for this order
                last_notif = db.notifications.find_one(
                    {'order_id': order_id_str},
                    sort=[('created_at', -1)]
                )

                # Send reminder if no notification exists or last one was > 5 hours ago
                should_remind = False
                if not last_notif:
                    should_remind = True
                elif last_notif.get('created_at', '') < cutoff:
                    should_remind = True

                if should_remind and user_id:
                    now_iso = datetime.utcnow().isoformat()
                    msg = (f"⏰ Reminder: Your order at {sm_name} is still READY FOR PICKUP! "
                           f"{item_count} item{'s' if item_count != 1 else ''} waiting. "
                           f"Visit the store to pay and collect.")
                    db.notifications.insert_one({
                        'user_id': user_id,
                        'order_id': order_id_str,
                        'message': msg,
                        'is_read': False,
                        'created_at': now_iso
                    })
                    print(f"[Reminder] Sent pickup reminder for order at {sm_name} to user {user_id}")

        except Exception as e:
            print(f"[Reminder] Error in pickup reminder loop: {e}")


if __name__ == '__main__':
    # Start background reminder thread
    reminder_thread = threading.Thread(target=pickup_reminder_loop, daemon=True)
    reminder_thread.start()
    print("[Reminder] Background pickup reminder thread started (checks every 30 min, re-notifies every 5 hr)")

    app.run(debug=True, port=5001)
