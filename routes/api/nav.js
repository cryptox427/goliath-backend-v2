const express = require('express');
const router = express.Router();

const { getMinterInfo, getCollectionInfo, getCollectionSlug, getAssetInfo, getFeedsDataAssets, getCollectionName
} = require('../../service/service');

//tokens page

router.get('/token/getAssetsCount/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const slug = (await getCollectionSlug(contractAddress)).slug;
    const totalAssetsCount = (await getCollectionInfo(slug)).collectionInfo.stats.count;
    res.json({
      "Synced Tokens": totalAssetsCount
    })
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/token/getAssetsInfo/:contractAddress/:tokenId', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const tokenId = req.params.tokenId;
    const assetInfo = await getAssetInfo(contractAddress, tokenId);
    res.json(assetInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

//feeds page

router.get('/feeds/getFeedsInfo/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const collectionName = (await getCollectionName(contractAddress)).name;
    const feedsInfo = await getFeedsDataAssets(contractAddress);
    const response = {
      "collectionName": collectionName,
      "feedsInfo": feedsInfo
    }
    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})


//mints info
router.get('/mint/getCollectionInfo/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    // const slug = (await getCollectionSlug(contractAddress)).slug;
    // console.log(slug);
    let resp = await getMinterInfo(contractAddress);

    res.json(resp)
  } catch (err) {
    console.log(err);
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})
//mints page

router.get('/mints/getCollectionInfo/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    // const slug = (await getCollectionSlug(contractAddress)).slug;
    // console.log(slug);
    const collectionInfo = (await getCollectionInfo(contractAddress)).collectionInfo;
    const mintsInfo = {
      "total_mints": collectionInfo.stats.count,
      "unique_minters": collectionInfo.stats.num_owners,
      "percent": ((collectionInfo.stats.num_owners / collectionInfo.stats.count) * 100).toFixed(2),
      "average_mint": (collectionInfo.stats.count / collectionInfo.stats.num_owners).toFixed(2)
    }
    console.log(mintsInfo);
    res.json(mintsInfo)
  } catch (err) {
    console.log(err);
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

module.exports = router;
