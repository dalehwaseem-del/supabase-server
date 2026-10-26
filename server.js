const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const asText = (value) => value === null || value === undefined
    ? ''
    : String(value).trim();

const firstValue = (row, keys) => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && asText(row[key]) !== '') {
            return row[key];
        }
    }
    return '';
};

const LEAVE_NUMBER_KEYS = [
    'leave_number',
    'sick_leave_number',
    'leaveNumber',
    'sickLeaveNumber',
    'leave_code',
    'sick_leave_code',
    'leaveCode',
    'code',
    'psl_number',
    'PSL'
];

const ID_NUMBER_KEYS = [
    'id_number',
    'national_id',
    'identity_number',
    'iqama_number',
    'idNumber',
    'nationalId',
    'identityNumber'
];

const sameValue = (left, right) =>
    asText(left).toLowerCase() === asText(right).toLowerCase();

app.get('/', (_req, res) => {
    res.json({ ok: true, service: 'seha-server' });
});

app.post('/api/get-leave', async (req, res) => {
    const leaveNumber = asText(req.body?.leaveNumber);
    const idNumber = asText(req.body?.idNumber);

    if (!leaveNumber || !idNumber) {
        return res.status(400).json({
            data: [],
            error: 'leaveNumber and idNumber are required'
        });
    }

    try {
        // لا نفترض اسم عمود محدد؛ لأن leave_number غير موجود في المخطط الحالي.
        const { data, error } = await supabase
            .from('sick_leaves')
            .select('*');

        if (error) {
            throw error;
        }

        const rows = Array.isArray(data) ? data : [];
        const matchingRows = rows.filter((item) => {
            const rowLeaveNumber = firstValue(item, LEAVE_NUMBER_KEYS);
            const rowIdNumber = firstValue(item, ID_NUMBER_KEYS);
            return sameValue(rowLeaveNumber, leaveNumber) && sameValue(rowIdNumber, idNumber);
        });

        const formattedData = matchingRows.map((item) => ({
            PatientName: firstValue(item, [
                'patient_name', 'patientName', 'PatientName', 'employee_name', 'full_name'
            ]),
            'Patient Name': firstValue(item, [
                'companion_name', 'companionName', 'Patient Name'
            ]),
            Relationship: firstValue(item, [
                'relationship', 'relation'
            ]) || null,
            SickLeaveDate: firstValue(item, [
                'sick_leave_date', 'sickLeaveDate', 'SickLeaveDate'
            ]),
            From: firstValue(item, [
                'from_date', 'fromDate', 'start_date', 'startDate', 'From'
            ]),
            To: firstValue(item, [
                'to_date', 'toDate', 'end_date', 'endDate', 'To'
            ]),
            Duration: firstValue(item, [
                'duration', 'leave_duration', 'leaveDuration', 'Duration'
            ]),
            'Doctor NAME': firstValue(item, [
                'doctor_name', 'doctorName', 'Doctor NAME'
            ]),
            JobTitle: firstValue(item, [
                'job_title', 'jobTitle', 'JobTitle'
            ])
        }));

        return res.json({ data: formattedData });
    } catch (err) {
        console.error('get-leave error:', err);
        return res.status(500).json({
            data: [],
            error: 'Database query failed',
            details: process.env.NODE_ENV === 'production' ? undefined : err.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
