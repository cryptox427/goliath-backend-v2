const express = require('express');
const router = express.Router();

const { getListingInfoV1 } = require('../../service/service');

router.get('/getListingHistoryInfo', async (req, res) => {
  try {
    const collectionData = await getListingInfoV1();
    res.json(collectionData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;