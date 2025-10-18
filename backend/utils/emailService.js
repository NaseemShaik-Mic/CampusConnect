import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email function
export const sendEmail = async (options) => {
  try {
    const message = {
      from: `College Digital Portal <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

// Template functions
export const sendAssignmentGradedEmail = async (studentEmail, studentName, assignmentTitle, grade, feedback) => {
  await sendEmail({
    to: studentEmail,
    subject: 'Assignment Graded - College Digital Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Assignment Graded</h2>
        <p>Dear ${studentName},</p>
        <p>Your assignment has been graded!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Assignment:</strong> ${assignmentTitle}</p>
          <p><strong>Grade:</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">${grade}</span></p>
          ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
        </div>
        <p>Login to the portal to view complete details.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Details</a>
      </div>
    `
  });
};

export const sendLeaveStatusEmail = async (studentEmail, studentName, status, startDate, endDate, comments) => {
  const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
  
  await sendEmail({
    to: studentEmail,
    subject: `Leave Request ${status.toUpperCase()} - College Digital Portal`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Dear ${studentName},</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${status}</span></p>
          <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>
          ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        </div>
        <a href="${process.env.FRONTEND_URL}/leaves" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Details</a>
      </div>
    `
  });
};