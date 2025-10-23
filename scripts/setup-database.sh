#!/bin/bash
# Veventures Database Setup Script
# Otomatik database kurulum ve seed data import

set -e

echo "🚀 Setting up Veventures database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# MongoDB connection check
echo -e "${BLUE}📡 Checking MongoDB connection...${NC}"
if ! mongosh --quiet --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo -e "${RED}❌ MongoDB is not running! Please start MongoDB first.${NC}"
    echo -e "${YELLOW}   sudo systemctl start mongod${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MongoDB is running${NC}"

# Database and user setup
echo -e "${BLUE}👤 Setting up database users...${NC}"
mongosh --quiet --eval "
use admin;
try {
  db.createUser({
    user: 'veventuresAdmin',
    pwd: 'strongPassword123',
    roles: ['userAdminAnyDatabase', 'dbAdminAnyDatabase', 'readWriteAnyDatabase']
  });
  print('✅ Admin user created');
} catch(e) { 
  if (e.code === 11000) {
    print('ℹ️  Admin user already exists');
  } else {
    print('❌ Error creating admin user: ' + e.message);
  }
}

use veventures;
try {
  db.createUser({
    user: 'veventures',
    pwd: 'veventuresDbPassword', 
    roles: ['readWrite']
  });
  print('✅ Veventures user created');
} catch(e) {
  if (e.code === 11000) {
    print('ℹ️  Veventures user already exists');
  } else {
    print('❌ Error creating veventures user: ' + e.message);
  }
}
"

# Check for seed data
SEED_PATH=""
if [ -d "./database/seed/LibreChat" ]; then
    SEED_PATH="./database/seed/LibreChat"
    echo -e "${GREEN}📦 Found LibreChat seed data${NC}"
elif [ -d "./database/seed/veventures" ]; then
    SEED_PATH="./database/seed/veventures"
    echo -e "${GREEN}📦 Found Veventures seed data${NC}"
else
    echo -e "${RED}❌ No seed data found in ./database/seed/${NC}"
    echo -e "${YELLOW}   Available options:${NC}"
    echo -e "${YELLOW}   1. Add seed data to ./database/seed/LibreChat/ or ./database/seed/veventures/${NC}"
    echo -e "${YELLOW}   2. Initialize empty database with default endpoints${NC}"
    
    read -p "Initialize with default endpoints? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔧 Initializing with default endpoints...${NC}"
        
        # Create basic admin collections
        mongosh --quiet "mongodb://veventures:veventuresDbPassword@localhost:27017/veventures?authSource=veventures" --eval "
        // Create admin_endpoint_settings
        db.adminendpointsettings.insertMany([
          {
            endpoint: 'openAI',
            enabled: true,
            allowedRoles: ['USER', 'ADMIN'],
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            endpoint: 'anthropic',
            enabled: true,
            allowedRoles: ['USER', 'ADMIN'], 
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            endpoint: 'google',
            enabled: true,
            allowedRoles: ['USER', 'ADMIN'],
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
        
        // Create admin_model_settings
        db.adminmodelsettings.insertMany([
          {
            endpoint: 'openAI',
            model: 'gpt-4',
            isEnabled: true,
            allowedRoles: ['USER', 'ADMIN'],
            order: 0,
            createdAt: new Date(),
            updatedBy: 'system'
          },
          {
            endpoint: 'openAI',
            model: 'gpt-3.5-turbo',
            isEnabled: true, 
            allowedRoles: ['USER', 'ADMIN'],
            order: 1,
            createdAt: new Date(),
            updatedBy: 'system'
          }
        ]);
        
        print('✅ Default collections initialized');
        "
        
        echo -e "${GREEN}✅ Database setup completed with default data!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Setup cancelled${NC}"
        exit 1
    fi
fi

# Import seed data
echo -e "${BLUE}📦 Importing seed data from ${SEED_PATH}...${NC}"

# Drop existing database for clean import
mongosh --quiet "mongodb://veventures:veventuresDbPassword@localhost:27017/veventures?authSource=veventures" --eval "
db.dropDatabase();
print('🗑️  Existing database cleared');
"

# Import the seed data
mongorestore --uri="mongodb://veventures:veventuresDbPassword@localhost:27017/veventures?authSource=veventures" \
  --drop \
  "$SEED_PATH" || {
    echo -e "${RED}❌ Failed to import seed data${NC}"
    exit 1
}

# Verify import
echo -e "${BLUE}🔍 Verifying database import...${NC}"
mongosh --quiet "mongodb://veventures:veventuresDbPassword@localhost:27017/veventures?authSource=veventures" --eval "
print('📊 Database verification:');
print('Collections: ' + db.getCollectionNames().length);
print('Users: ' + db.users.countDocuments());
print('Admin Endpoints: ' + db.adminendpointsettings.countDocuments()); 
print('Admin Models: ' + db.adminmodelsettings.countDocuments());
print('Conversations: ' + db.conversations.countDocuments());
"

echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
echo -e "${BLUE}🎯 Next steps:${NC}"
echo -e "${YELLOW}   1. Update your .env file with the database connection${NC}"
echo -e "${YELLOW}   2. Start the application: npm run dev${NC}"
echo -e "${YELLOW}   3. Access admin panel: http://localhost:3090/d/admin${NC}"