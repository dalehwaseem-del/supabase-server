const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/api/get-leave', async (req, res) => {
    try {
        const { leaveNumber, idNumber } = req.body;

        if (!leaveNumber || idNumber === undefined) {
            return res.status(400).json({ data: [], error: "Missing fields" });
        }

        const { data, error } = await supabase
            .from('sick_leaves')
            .select('*')
            .eq('leave_number', leaveNumber)
            .eq('id_number', idNumber);

        if (error) throw error;

        const formattedData = data.map(item => ({
            PatientName: item.patient_name || "",
            "Patient Name": item.companion_name || "",
            Relationship: item.relationship || null,
            SickLeaveDate: item.sick_leave_date || "",
            From: item.from_date || "",
            To: item.to_date || "",
            Duration: item.duration || "",
            "Doctor NAME": item.doctor_name || "",
            JobTitle: item.job_title || ""
        }));

        return res.json({ data: formattedData });
    } catch (err) {
        return res.status(500).json({ data: [], error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
