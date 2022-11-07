const express = require('express');
const router = express.Router();

const { getCollectionInfo, getCollectionInfoV1, getTraders, getListingHistory, getSalesDataAssets, getSalesLiveData, getListingDataAssets, saveSalesData, saveListingData,
  assetsForSales, getSellWall, getHolderInfo, getHolderInfoByTime, getFloorPrice, getListed, getStats1, getStats, getSaleVolume, search, collectioninfoV2,
  getCollectionSlug, getCollectionTraits, getTwitterInfo, getNScollectionData, getFilteredTokens

} = require('../../service/service');


const { calculatorBuyRank } = require('../../service/api');
// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get('/slug/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const slug = (await getCollectionSlug(contractAddress)).slug;
    res.json({ "slug": slug });
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
})

router.get('/collectioninfoV2/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const collectionData = await collectioninfoV2(slug);
    res.json(collectionData);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
})


// getTopUsers
router.get('/getAll/:address/:time', async (req, res) => {
  try {
    const address = req.params.address;
    const time = req.params.time;
    const collectionData = await getSaleVolume(address, time);
    res.json(collectionData);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
})
router.get('/query/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const queryData = await search(query);
    res.json(queryData);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
})

router.get('/getStats/:address', async (req, res) => {
  try {
    const slug = req.params.address;
    const collectionData = await getStats(slug);
    res.json(collectionData);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
})

router.get('/getStatsv1/:address', async (req, res) => {
  try {
    const slug = req.params.address;
    const collectionData = await getStats1(slug);
    res.json(collectionData);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send(`Server Error: ${JSON.stringify(e)}`);
  }
})

router.get('/getfullstatsv2/:address', async (req, res) => {
  try {
    const addr = req.params.address;
    const result = await getNScollectionData(addr);
    res.json(result)
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send(`Server Error: ${JSON.stringify(e)}`);
  }
})

router.get('/getTwitter/:address', async (req, res) => {
  try {
    const addr = req.params.address;
    const result = await getTwitterInfo(addr);
    res.json(result)
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send(`Server Error: ${JSON.stringify(e)}`);
  }
})



router.get('/getLiveListed/:address', async (req, res) => {
  try {
    const slug = req.params.address;
    const collectionData = await getListed(slug);
    res.json(collectionData);
  }
  catch (e) {
    console.error(e)
    res.status(500).send(`Server Error: ${JSON.stringify(e)}`);
  }
})

router.get('/getCollectionTraits/:address', async (req, res) => {
  try {
    const slug = req.params.address;
    const traitData = await getCollectionTraits(slug);
    res.json(traitData);
  }
  catch (e) {
    console.error(e)
    res.status(500).send(`Server Error: ${JSON.stringify(e)}`);
  }
})


router.get('/getFilteredTokens/:address/:traitFilterstring/:pricemin/:pricemax/:page', async (req, res) => {
  try {

    console.log(req.params.filterstring)


    var t = 
    {
    traitFilter: eval(req.params.traitFilterstring),
    priceFilter: {symbol: "ETH", max: Number(req.params.pricemax), min: Number(req.params.pricemin)}
    }

    console.log(t)

    const slug = req.params.address
    //const filterString = JSON.parse(req.params.filterstring)
    const page = req.params.page
    const filteredData = await getFilteredTokens(slug,t,page);
    res.json(filteredData);
  }
  catch (e) {
    console.error(e)
    res.status(500).send(`Server Error: ${JSON.stringify(e)}`);
  }
})







router.get('/getListingHistory/:address', async (req, res) => {
  try {
    const slug = req.params.address;
    const collectionData = await getListingHistory(slug);
    res.json(collectionData);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
})

router.get('/getTraders/:address', async (req, res) => {
  try {
    const slug = req.params.address;
    const collectionData = await getTraders(slug);
    res.json(collectionData);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
})
router.get('/collection/:address', async (req, res) => {
  try {
    const slug = req.params.address;
    const collectionData = await getCollectionInfo(slug);
    res.json(collectionData);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
})

router.get('/getCollection/:pageNumber/:limitNumber', async (req, res) => {
  try {
    const pageNum = req.params.pageNumber;
    const pageLim = req.params.limitNumber;
    const collectionData = await getCollectionInfoV1(pageNum, pageLim);
    res.json(collectionData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/getSalesDataAssets/:contractAddress/:start_date/:end_date', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;

    const assetData = await getSalesDataAssets(contractAddress, req.params.start_date, req.params.end_date);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/getSalesLiveData/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;

    const assetData = await getSalesLiveData(contractAddress);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




router.get('/getListingDataAssets/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;

    const assetData = await getListingDataAssets(contractAddress);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/saveSalesDataChart/:contractAddress/:timeInterval', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const timeInterval = req.params.timeInterval;

    const assetData = await saveSalesData(contractAddress, timeInterval);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.get('/saveListingDataChart/:contractAddress/:timeInterval', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const timeInterval = req.params.timeInterval;

    const assetData = await saveListingData(contractAddress, timeInterval);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.get('/assetsForSalesChart/:contractAddress/:timeInterval', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const timeInterval = req.params.timeInterval;

    const assetData = await assetsForSales(contractAddress, timeInterval);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/getSellWall/:contractAddress/:priceInterval', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const priceInterval = req.params.priceInterval;
    const assetData = await getSellWall(contractAddress, priceInterval);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});






router.get('/getHolderInfo/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const assetData = await getHolderInfo(contractAddress);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/getFloorPrice/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const assetData = await getFloorPrice(contractAddress);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/getHolderInfoByTime/:contractAddress/:from/:to', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const from = req.params.from;
    const to = req.params.to;
    const assetData = await getHolderInfoByTime(contractAddress, from, to);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
