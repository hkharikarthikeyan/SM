import sys
import os
# Import shared database models from FG backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'FG', 'backend')))
from models import db, User, State, District, Supermarket, Product, Order, OrderItem, Notification
