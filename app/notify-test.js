"user strict"

const fetch = require("node-fetch")
const config = require("./config")

const notifyLine = (message, token) => {
	if (token === "") return
	fetch("https://notify-api.line.me/api/notify", {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
		body: new URLSearchParams({ message }),
	})
}

; (async () => {
	notifyLine("notify test!", config.lineNotifyToken)
})()
