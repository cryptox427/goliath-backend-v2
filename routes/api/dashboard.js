const express = require("express");
const axios = require("axios");
const { response } = require("express");
const router = express.Router();


async function getCollectionInfo(pageNumber, pageLimit) {
    const options = {method: 'GET', headers: {Accept: 'application/json', 'X-API-KEY': '7c01ed670df3403bb8105e5587f93d7f'}};

    const collectionData = (await axios.get(`https://api.opensea.io/api/v1/collections?offset=${pageNumber}&limit=${pageLimit}`, options)).data;
    return collectionData;
}


router.get('/getCollectionStats/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let total_stats = [];
    for(const info of (await getCollectionInfo(pageNum, pageLim)).collections) {
        total_stats.push(info.stats);
    }
    res.send(total_stats)
})

module.exports = router;