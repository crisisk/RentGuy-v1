#!/usr/bin/env python3
"""
Seed script to create Bart user with mr-dj password
"""
import os
import sys
sys.path.append('/app')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from app.modules.auth.models import User
from app.core.db import Base

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://rentguy:rentguy_secure_2025@db:5432/rentguy")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_bart_user():
    """Create Bart user with mr-dj password"""
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "bart@rentguy.demo").first()
        if existing_user:
            print("User bart@rentguy.demo already exists, updating password...")
            existing_user.password_hash = pwd_context.hash("mr-dj")
            db.commit()
            print("✅ Password updated for bart@rentguy.demo")
        else:
            # Create new user
            hashed_password = pwd_context.hash("mr-dj")
            user = User(
                email="bart@rentguy.demo",
                password_hash=hashed_password,
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            print("✅ Created user: bart@rentguy.demo with password: mr-dj")
        
        # Also create the demo user for compatibility
        demo_user = db.query(User).filter(User.email == "rentguy@demo.local").first()
        if not demo_user:
            demo_hashed = pwd_context.hash("rentguy")
            demo_user = User(
                email="rentguy@demo.local",
                password_hash=demo_hashed,
                role="admin",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            print("✅ Created demo user: rentguy@demo.local")
            
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_bart_user()
