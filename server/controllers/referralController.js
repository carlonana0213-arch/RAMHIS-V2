const Patient = require("../models/Patient");
const logAudit = require("../utils/auditLogger");

exports.referPatient = async (req, res) => {
  try {
    const { department, reason } = req.body;

    const previous = await Patient.findById(req.params.id)
      .select("department status generalInfo location eventId")
      .lean();

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

    if (patient) {
      await logAudit(req, {
        module: "Consultation",
        action: "Refer Patient",
        description: `Referred ${patient.generalInfo?.name || "Unknown Patient"} from ${
          previous?.department || "no department"
        } to ${department}${reason ? `. Reason: ${reason}` : ""}.`,
        targetType: "Patient",
        targetId: patient._id,
        targetName: patient.generalInfo?.name || "Unknown Patient",
        location: patient.location,
        eventId: patient.eventId,
        changes: [
          {
            field: "department",
            label: "Department",
            before: previous?.department || null,
            after: department,
          },
          {
            field: "status",
            label: "Status",
            before: previous?.status || null,
            after: "waiting",
          },
        ],
        metadata: { reason, referredTo: department },
      });
    }

    res.json(patient);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
