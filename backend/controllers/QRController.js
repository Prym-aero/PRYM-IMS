const QR = require('../models/QR');

exports.getCounts = async (req, res) => {
    try {
        const qrData = await QR.findOne({}); // Assuming you want the first document
        if (!qrData) {
            return res.status(404).json({ message: "QR data not found" });
        }

        const counts = {
            scannedCount: qrData.scannedCount,
            generatedCount: qrData.generatedCount,
            qrId: qrData.qrId.length
        };

        res.status(200).json({ message: "Counts fetched successfully", counts });
    } catch (error) {
        console.error("Error fetching counts:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


exports.addCounts = async (req, res) => {
    try {
        const { count } = req.body;

        if (!count || typeof count !== 'number') {
            return res.status(400).json({ message: "Invalid count value" });
        }

        const qrData = await QR.findOne({}); // Assuming you want to update the first document
        if (!qrData) {
            return res.status(404).json({ message: "QR data not found" });
        }

        qrData.generatedCount = count;
        qrData.save();

        res.status(200).json({ message: "Counts updated successfully", qrData });

    } catch (error) {
        console.error("Error adding counts:", error);
        res.status(500).json({ message: "Internal Server Error", error });

    }
}

exports.getQrIds = async (req, res) => {
    try {
        const qrData = await QR.findOne({}); // Assuming you want the first document
        if (!qrData) {
            return res.status(404).json({ message: "QR data not found" });
        }

        res.status(200).json({ message: "QR IDs fetched successfully", qrIds: qrData.qrId });
    } catch (err) {
        console.error("Error fetching QR IDs:", err);
        res.status(500).json({ message: "Internal Server Error", err });
    }
}


