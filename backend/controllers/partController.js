const Part = require('../models/produtPart'); // ✅ Make sure filename is correct

exports.AddPart = async (req, res) => {
    try {
        const {  part_name, part_number } = req.body;

        if (!part_name || !part_number) {
            return res.status(400).json({ message: "Part info not found" });
        }

        const existedPart = await Part.findOne({ part_name });
        if (existedPart) {
            return res.status(409).json({ message: "Part is already present in the database" });
        }

        const part = new Part({
            
            part_name,
            part_number,

        });

        await part.save();

        res.status(201).json({ message: "Added part to the list", part });

    } catch (error) {
        console.error("Error in adding part to the list:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

exports.getParts = async (req, res) => {
    try {

        const parts = await Part.find();

        if (!parts) {
            return res.status(404).json({ message: "parts not found or empty" })
        }

        res.status(200).json({ message: "fetching all the problem successfully", parts });

    } catch (err) {
        console.log('the error in fetching list of parts', err)
        res.status(500).json({ message: "internal server error", err });
    }
}
