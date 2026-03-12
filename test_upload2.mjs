import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function testUpload() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log("Got token");

    const form = new FormData();
    form.append('file', fs.createReadStream('THT_November 2025.xlsx'));
    form.append('jenis_iuran', 'THT');
    form.append('bulan', '11');
    form.append('tahun', '2025');

    console.log("Starting upload...");
    const res = await axios.post('http://localhost:3000/api/kepesertaan/iuran/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    if (err.response) {
       console.error("HTTP ERROR:", err.response.status, err.response.data);
    } else {
       console.error("NETWORK ERROR:", err.message);
    }
  }
}
testUpload();
