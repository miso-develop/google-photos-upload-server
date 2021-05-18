"user strict"

const fs = require("fs-extra")
const fetch = require("node-fetch")
const { URLSearchParams } = require("url")
const diskspace = require("diskspace")
const dayjs = require("dayjs")
const config = require("./config")

dayjs.extend(require("dayjs/plugin/timezone"))
dayjs.extend(require("dayjs/plugin/utc"))
dayjs.tz.setDefault("Asia/Tokyo")

const periodDate = dayjs().subtract(config.periodDay, "day")
const photosRootDir = config.photosDir



const flatten = async (dir) => {
	for (const entity of await fs.readdir(dir)) {
		const fullpath = `${dir}/${entity}`
		
		const stat = await fs.stat(fullpath)
		if (stat.isFile()) {
			const dest = `${photosRootDir}/${entity}`
			if (fullpath === dest) continue
			
			try {
				await fs.move(fullpath, dest)
			} catch (e) {
				const renameDest = `${photosRootDir}/${fullpath.replace("../photos/", "").replace(/\//g, "_")}`
				await fs.move(fullpath, renameDest)
			}
			
		} else {
			await flatten(fullpath)
		}
	}
}



const deleteOldPhotos = async (dir, period) => {
	for (const entity of await fs.readdir(dir)) {
		const fullpath = `${dir}/${entity}`
		
		const stat = await fs.stat(fullpath)
		if (stat.isFile()) {
			const photoCTime = dayjs(stat.ctime)
			
			if (period < photoCTime) continue
			console.log(`delete: ${fullpath}`)
			await fs.unlink(fullpath)
			
		} else {
			await deleteOldPhotos(fullpath, period)
		}
	}
}



const notifyFreeSize = async (dir, minFreeSize, lineNotifyToken) => {
	const freeSize = await getDiskFreeSize(dir)
	const freeSizeGB = round(freeSize / 1024 / 1024 / 1024, 1)
	console.log(freeSizeGB, "GB")
	
	if (freeSize > minFreeSize) return
	notifyLine(freeSizeGB, lineNotifyToken)
}

const getDiskFreeSize = async (disk) => new Promise(res => diskspace.check(disk, (err, result) => res(result.free)))

const round = (value, base) => (Math.round(value / Math.pow(0.1, base)) * Math.pow(0.1, base)).toFixed(base > 0 ? base : 0)

const notifyLine = (message, token) => {
	if (token === "") return
	fetch("https://notify-api.line.me/api/notify", {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
		body: new URLSearchParams({ message }),
	})
}



; (async () => {
	await flatten(config.photosDir)
	await deleteOldPhotos(config.photosDir, periodDate)
	await notifyFreeSize(config.photosDir, config.minFreeSize, config.lineNotifyToken)
})()
