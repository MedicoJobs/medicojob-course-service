const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { generateCertificate } = require('../utils/pdf');
const { sendCertificateEmail } = require('../utils/email');
const path = require('path');
const fs = require('fs');

exports.uploadCourse = async (req, res) => {
  try {
    const { title, description, instructor, durationMinutes } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Course video file is required' });
    }

    const videoUrl = req.file.location;

    const course = new Course({
      title,
      description,
      instructor,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : 0,
      videoUrl
    });

    await course.save();

    res.status(201).json({ message: 'Course uploaded successfully', course });
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.completeCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const { name, email } = req.user; // ensure user has email and name from auth token, if not we need to fetch it from user-service or expect it in body. Wait, the token from user-service only has { id, role }. We need to pass name and email in the body for the certificate.

    const { userName, userEmail } = req.body;

    if (!userName || !userEmail) {
      return res.status(400).json({ message: 'User name and email are required to generate certificate' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check if already completed
    let enrollment = await Enrollment.findOne({ userId, courseId });
    if (enrollment) {
      return res.status(400).json({ message: 'Course already completed by this user' });
    }

    enrollment = new Enrollment({
      userId,
      userName,
      userEmail,
      courseId
    });

    await enrollment.save();

    // Generate Certificate
    // Create temp directory if not exists
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const pdfPath = path.join(tempDir, `cert_${Date.now()}.pdf`);
    await generateCertificate(userName, course.title, pdfPath);

    // Send Email
    try {
      await sendCertificateEmail(userEmail, userName, course.title, pdfPath);
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
      // We don't fail the request if email fails, but we should log it
    }

    // Clean up temporary PDF file
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    res.json({ message: 'Course completed successfully. Certificate has been emailed to you!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
