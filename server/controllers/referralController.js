const Patient = require("../models/Patient");

exports.referPatient = async (req, res) => {
  try {
    const { department, reason } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        department,
        referral: {
          department,
          reason,
          date: new Date(),
        },
        status: "waiting",
      },
      { new: true },
    );

    res.json(patient);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
