const MONGO_URI = "mongodb+srv://amelie_bontemps:Am3Lo678@clusterlotr.ym74pn1.mongodb.net/";

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

interface UserInput {
  email: string;
  password: string;
}

interface IUser extends mongoose.Document {
  email: string;
  password: string;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model<IUser>('User', UserSchema);

async function createUser({ email, password }: UserInput) {
  await mongoose.connect(MONGO_URI);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Gebruiker bestaat al');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    email,
    password: hashedPassword,
  });

  await user.save();
  console.log('Gebruiker aangemaakt:', user.email);
}

createUser({ email: 'frodo@shire.com', password: 'ring1234' })
  .then(() => process.exit())
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });

