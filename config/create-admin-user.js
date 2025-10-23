const path = require('path');
const mongoose = require('mongoose');
const { User } = require('@librechat/data-schemas').createModels(mongoose);
const { SystemRoles } = require('librechat-data-provider');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

require('module-alias')({ base: path.resolve(__dirname, '..', 'api') });
const { registerUser } = require('~/server/services/AuthService');
const { askQuestion, silentExit } = require('./helpers');
const connect = require('./connect');

console.purple = (text) => console.log('\x1b[35m%s\x1b[0m', text);
console.green = (text) => console.log('\x1b[32m%s\x1b[0m', text);
console.red = (text) => console.log('\x1b[31m%s\x1b[0m', text);
console.orange = (text) => console.log('\x1b[33m%s\x1b[0m', text);
console.blue = (text) => console.log('\x1b[34m%s\x1b[0m', text);

(async () => {
  await connect();

  console.purple('🛡️  ========================================');
  console.purple('     VEVENTURES ADMIN USER CREATOR');
  console.purple('🛡️  ========================================');
  console.blue('   Bu script admin yetkisine sahip kullanıcı oluşturur');
  console.purple('========================================');

  if (process.argv.length < 4) {
    console.orange('Usage: npm run create-admin <email> <password> [name] [username]');
    console.orange('Note: Eğer argüman vermezseniz, size sorulacak.');
    console.purple('----------------------------------------');
  }

  let email = '';
  let password = '';
  let name = '';
  let username = '';

  // Command line arguments parse et
  if (process.argv[2]) {
    email = process.argv[2];
  }
  if (process.argv[3]) {
    password = process.argv[3];
  }
  if (process.argv[4]) {
    name = process.argv[4];
  }
  if (process.argv[5]) {
    username = process.argv[5];
  }

  // Email input
  if (!email) {
    console.blue('\n📧 Admin kullanıcının email adresini girin:');
    email = await askQuestion('Email: ');
  }
  
  if (!email.includes('@')) {
    console.red('❌ Hata: Geçersiz email adresi!');
    silentExit(1);
  }

  // Password input
  if (!password) {
    console.blue('\n🔒 Admin kullanıcının şifresini girin:');
    password = await askQuestion('Password: ');
  }
  
  if (!password || password.length < 6) {
    console.red('❌ Hata: Şifre en az 6 karakter olmalı!');
    silentExit(1);
  }

  // Name input (default: email prefix)
  const defaultName = email.split('@')[0];
  if (!name) {
    console.blue(`\n👤 Admin kullanıcının adını girin (default: ${defaultName}):`);
    name = await askQuestion(`Name (${defaultName}): `);
    if (!name) {
      name = defaultName;
    }
  }

  // Username input (default: email prefix)
  if (!username) {
    console.blue(`\n🏷️  Admin kullanıcının username'ini girin (default: ${defaultName}):`);
    username = await askQuestion(`Username (${defaultName}): `);
    if (!username) {
      username = defaultName;
    }
  }

  // Kullanıcı mevcut mu kontrol et
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    console.red('❌ Hata: Bu email veya username ile kullanıcı zaten mevcut!');
    console.orange(`   Mevcut: ${userExists.email} (${userExists.role})`);
    silentExit(1);
  }

  // Confirm admin creation
  console.purple('\n🔍 Admin kullanıcı bilgileri:');
  console.blue(`   📧 Email: ${email}`);
  console.blue(`   👤 Name: ${name}`);
  console.blue(`   🏷️  Username: ${username}`);
  console.blue(`   🛡️  Role: ADMIN`);
  console.blue(`   ✅ Email Verified: true`);
  
  const confirm = await askQuestion('\n✅ Bu bilgilerle admin kullanıcı oluşturulsun mu? (Y/n): ');
  if (confirm.toLowerCase() === 'n') {
    console.orange('❌ İşlem iptal edildi.');
    silentExit(0);
  }

  // Create admin user
  const user = { 
    email, 
    password, 
    name, 
    username, 
    confirm_password: password 
  };

  let result;
  try {
    console.blue('\n🔧 Admin kullanıcı oluşturuluyor...');
    result = await registerUser(user, { emailVerified: true });
  } catch (error) {
    console.red('❌ Hata: ' + error.message);
    silentExit(1);
  }

  if (result.status !== 200) {
    console.red('❌ Hata: ' + result.message);
    silentExit(1);
  }

  // Upgrade to admin role
  const userCreated = await User.findOne({ $or: [{ email }, { username }] });
  if (userCreated) {
    try {
      // Force admin role assignment
      await User.updateOne(
        { _id: userCreated._id }, 
        { 
          $set: { 
            role: SystemRoles.ADMIN,
            banned: false,
            emailVerified: true
          } 
        }
      );
      
      console.green('\n🎉 Admin kullanıcı başarıyla oluşturuldu!');
      console.green('🛡️  ================================');
      console.green(`📧 Email: ${email}`);
      console.green(`👤 Name: ${name}`);
      console.green(`🏷️  Username: ${username}`);
      console.green(`🔑 Role: ${SystemRoles.ADMIN}`);
      console.green(`✅ Email Verified: true`);
      console.green(`🚫 Banned: false`);
      console.green('🛡️  ================================');
      console.blue('\n💡 Bu kullanıcı ile giriş yaparak admin paneline erişebilirsiniz:');
      console.blue('   🌐 http://localhost:3090/d/admin');
      console.purple('\n🚀 Admin kullanıcı hazır!');
      
    } catch (error) {
      console.red('❌ Admin role assignment hatası: ' + error.message);
      silentExit(1);
    }
  } else {
    console.red('❌ Kullanıcı oluşturuldu ama bulunamadı!');
    silentExit(1);
  }
  
  silentExit(0);
})();

process.on('uncaughtException', (err) => {
  if (!err.message.includes('fetch failed')) {
    console.error('Beklenmeyen hata:');
    console.error(err);
  }

  if (err.message.includes('fetch failed')) {
    return;
  } else {
    process.exit(1);
  }
});