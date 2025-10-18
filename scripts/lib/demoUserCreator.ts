/**
 * Demo User Creator
 *
 * Utilities for creating demo users in the RentGuy database.
 */

import { execSync } from 'child_process'
import * as path from 'path'

export interface DemoUser {
  email: string
  password: string
  role: string
  tenantId?: string
}

export interface UserCreationResult {
  success: boolean
  message: string
  error?: string
}

/**
 * Creates a demo user in the database using Python script
 */
export function createDemoUser(user: DemoUser): UserCreationResult {
  try {
    // Path to the backend directory
    const backendDir = path.resolve('/srv/apps/RentGuy-v1/backend')

    // Create a temporary Python script to create the user
    const pythonScript = `
import sys
sys.path.insert(0, '${backendDir}')

from app.core.db import SessionLocal, engine, Base
from app.modules.auth.models import User
from app.modules.auth.security import hash_password

def create_user():
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == '${user.email}').first()
        if existing_user:
            print('EXISTS')
            return

        # Create new user
        hashed_password = hash_password('${user.password}')
        new_user = User(
            email='${user.email}',
            password_hash=hashed_password,
            role='${user.role}'
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f'CREATED:{new_user.id}')
    except Exception as e:
        db.rollback()
        print(f'ERROR:{str(e)}', file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == '__main__':
    create_user()
`

    // Execute the Python script
    const result = execSync(`cd ${backendDir} && python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    if (result.includes('EXISTS')) {
      return {
        success: true,
        message: `User ${user.email} already exists`,
      }
    }

    if (result.includes('CREATED')) {
      const userId = result.split(':')[1]?.trim()
      return {
        success: true,
        message: `User ${user.email} created successfully with ID ${userId}`,
      }
    }

    return {
      success: false,
      message: 'Unknown response from database',
      error: result,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to create user ${user.email}`,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Creates multiple demo users
 */
export function createDemoUsers(users: DemoUser[]): UserCreationResult[] {
  return users.map((user) => createDemoUser(user))
}

/**
 * Verifies that a user can authenticate with the given credentials
 */
export function verifyUserLogin(email: string, password: string): UserCreationResult {
  try {
    const backendDir = path.resolve('/srv/apps/RentGuy-v1/backend')

    const pythonScript = `
import sys
sys.path.insert(0, '${backendDir}')

from app.core.db import SessionLocal
from app.modules.auth.models import User
from app.modules.auth.security import verify_password

def verify_login():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == '${email}').first()
        if not user:
            print('USER_NOT_FOUND')
            return

        if verify_password('${password}', user.password_hash):
            print(f'LOGIN_SUCCESS:{user.role}')
        else:
            print('INVALID_PASSWORD')
    except Exception as e:
        print(f'ERROR:{str(e)}', file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == '__main__':
    verify_login()
`

    const result = execSync(`cd ${backendDir} && python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
    })

    if (result.includes('LOGIN_SUCCESS')) {
      const role = result.split(':')[1]?.trim()
      return {
        success: true,
        message: `Login verified for ${email} with role ${role}`,
      }
    }

    if (result.includes('USER_NOT_FOUND')) {
      return {
        success: false,
        message: `User ${email} not found`,
      }
    }

    if (result.includes('INVALID_PASSWORD')) {
      return {
        success: false,
        message: `Invalid password for ${email}`,
      }
    }

    return {
      success: false,
      message: 'Unknown verification result',
      error: result,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to verify login for ${email}`,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Lists all users in the database
 */
export function listUsers(): { email: string; role: string; id: number }[] {
  try {
    const backendDir = path.resolve('/srv/apps/RentGuy-v1/backend')

    const pythonScript = `
import sys
import json
sys.path.insert(0, '${backendDir}')

from app.core.db import SessionLocal
from app.modules.auth.models import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        user_list = [
            {'id': user.id, 'email': user.email, 'role': user.role}
            for user in users
        ]
        print(json.dumps(user_list))
    except Exception as e:
        print(f'ERROR:{str(e)}', file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == '__main__':
    list_users()
`

    const result = execSync(`cd ${backendDir} && python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
    })

    return JSON.parse(result)
  } catch (error) {
    console.error('Failed to list users:', error)
    return []
  }
}

/**
 * Deletes a user by email (use with caution!)
 */
export function deleteUser(email: string): UserCreationResult {
  try {
    const backendDir = path.resolve('/srv/apps/RentGuy-v1/backend')

    const pythonScript = `
import sys
sys.path.insert(0, '${backendDir}')

from app.core.db import SessionLocal
from app.modules.auth.models import User

def delete_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == '${email}').first()
        if not user:
            print('USER_NOT_FOUND')
            return

        db.delete(user)
        db.commit()
        print('DELETED')
    except Exception as e:
        db.rollback()
        print(f'ERROR:{str(e)}', file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == '__main__':
    delete_user()
`

    const result = execSync(`cd ${backendDir} && python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
    })

    if (result.includes('DELETED')) {
      return {
        success: true,
        message: `User ${email} deleted successfully`,
      }
    }

    if (result.includes('USER_NOT_FOUND')) {
      return {
        success: false,
        message: `User ${email} not found`,
      }
    }

    return {
      success: false,
      message: 'Unknown deletion result',
      error: result,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete user ${email}`,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
