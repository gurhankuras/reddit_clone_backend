import mongoose from 'mongoose';
import config from 'config';

const connect = () => {
  const dbUri = config.get('dbUri') as string;
  return mongoose
    .connect(dbUri, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    })
    .then((_) => {
      console.log('Database connected!');
    })
    .catch((error) => {
      console.log('Database Error: ', error);
      process.exit(1);
    });
};

export default connect;
