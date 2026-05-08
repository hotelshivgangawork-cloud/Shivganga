import axios from 'axios';

async function test() {
  try {
    const response = await axios.post('http://127.0.0.1:5001/api/otp/send', {
      email: 'test@example.com'
    });
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Error Message:', error.message);
  }
}

test();
