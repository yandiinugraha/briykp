import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function testUpload() {
  const form = new FormData();
  form.append('file', fs.createReadStream('THT_November 2025.xlsx'));
  form.append('jenis_iuran', 'THT');
  form.append('bulan', '11');
  form.append('tahun', '2025');

  try {
    const res = await axios.post('http://localhost:3000/api/kepesertaan/iuran/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer test' // dummy if no token enforced strictly, wait I need a token!
      }
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
  }
}
testUpload();
