import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import StudentForm from '../StudentForm';
import { FaTrash } from 'react-icons/fa'; // Import bin logo (trash icon)

const StudentWhoFilledAdmissionForm = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [lectureStartDate, setLectureStartDate] = useState(null);
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/students_who_have_filled_admission_form');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const handleSelectStudent = (student_id) => {
    setSelectedStudents((prevSelected) =>
      prevSelected.includes(student_id)
        ? prevSelected.filter(id => id !== student_id)
        : [...prevSelected, student_id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student.id));
    }
  };

  const sendMessages = async (studentMessage, parentMessage, studentPhone, parentPhone) => {
    try {
      await axios.post('http://localhost:3001/api/send_message', {
        contact: `91${studentPhone}`,
        message: studentMessage,
      });

      await axios.post('http://localhost:3001/api/send_message', {
        contact: `91${parentPhone}`,
        message: parentMessage,
      });
    } catch (error) {
      console.error('Error sending messages:', error);
    }
  };

  const handleSendMessage = async () => {
    try {
      for (const student_id of selectedStudents) {
        const student = students.find(s => s.id === student_id);
        const parentSalutation = student.gender.toLowerCase() === 'male' ? 'Dear parent, your son' : 'Dear parent, your daughter';
        const parentMessage = `${parentSalutation} ${student.name}, ${message}`;

        await sendMessages(message, parentMessage, student.phone, student.parent_phone);
      }
      alert('Messages sent successfully!');
    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Failed to send messages');
    }
  };

  const sendLectureStartDate = async () => {
    if (!lectureStartDate) {
      alert('Please select a date first.');
      return;
    }

    try {
      for (const student_id of selectedStudents) {
        const student = students.find(s => s.id === student_id);
        const formattedDate = lectureStartDate.toLocaleDateString();

        const studentMessage = `Hello ${student.name}, the college lectures start from ${formattedDate}.`;
        const parentSalutation = 'Dear Parent';
        const parentMessage = `${parentSalutation}, your son/daughter's lectures start from ${formattedDate}.`;

        await sendMessages(studentMessage, parentMessage, student.phone, student.parent_phone);
      }
      alert('Lecture start date messages sent successfully!');
    } catch (error) {
      console.error('Error sending lecture start date messages:', error);
      alert('Failed to send lecture start date messages');
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const toggleCustomMessage = () => {
    setShowCustomMessage(!showCustomMessage);
  };

  const confirmAdmission = async (student) => {
    try {
      const response = await axios.post('http://localhost:3001/api/confirm_admission', {
        name: student.name,
        phone: student.phone,
        parent_phone: student.parent_phone,
        gender: student.gender,
        percentage: student.percentage,
      });
      if (response.status === 200) {
        alert('Student admission confirmed successfully!');
      } else {
        alert('Failed to confirm admission');
      }
    } catch (error) {
      console.error('Error confirming admission:', error);
      alert('Failed to confirm admission');
    }
  };

  const deleteStudent = async (student_id) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/students_who_have_filled_admission_form/${student_id}`);
      if (response.status === 200) {
        alert('Student deleted successfully!');
        fetchStudents(); // Refresh the student list after deletion
      } else {
        alert('Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const deleteSelectedStudents = async () => {
    try {
      const promises = selectedStudents.map(student_id => 
        axios.delete(`http://localhost:3001/api/students_who_have_filled_admission_form/${student_id}`)
      );
      await Promise.all(promises);
      alert('Selected students deleted successfully!');
      setSelectedStudents([]); // Clear selected students after deletion
      fetchStudents(); // Refresh the student list after deletion
    } catch (error) {
      console.error('Error deleting selected students:', error);
      alert('Failed to delete selected students');
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mt-4">Students Who Have Filled Admission Form</h1>

      <button onClick={toggleForm} className="btn btn-outline-primary mt-3">
        {showForm ? 'Hide Form' : 'Add Student'}
      </button>
      {showForm && <StudentForm tableName="students_who_have_filled_admission_form" />}

      <div className="mb-3">
        <button onClick={toggleCustomMessage} className="btn btn-info mt-3">
          {showCustomMessage ? 'Hide Custom Message' : 'Custom Message'}
        </button>
        {showCustomMessage && (
          <div>
            <textarea
              className="form-control mt-3 p-2 border-info"
              rows="3"
              placeholder="Enter your message here"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="btn btn-primary mt-3" onClick={handleSendMessage}>
              Send Message
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="input-group mt-3">
          <DatePicker
            selected={lectureStartDate}
            onChange={(date) => setLectureStartDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select lecture start date"
            className="form-control"
          />
          <div className="input-group-append">
            <button className="btn btn-info" onClick={sendLectureStartDate}>
              Send Lecture Start Date
            </button>
            <button className="btn btn-danger ml-2" onClick={deleteSelectedStudents}>
              Delete Selected Students
            </button>
          </div>
        </div>
      </div>

      <table className="table table-hover table-bordered mt-4">
        <thead className="thead-dark">
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedStudents.length === students.length && students.length > 0}
                onChange={handleSelectAll}
              />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Parent Phone</th>
            <th>Gender</th>
            <th>Percentage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => handleSelectStudent(student.id)}
                />
              </td>
              <td>{student.id}</td>
              <td>{student.name}</td>
              <td>{student.phone}</td>
              <td>{student.parent_phone}</td>
              <td>{student.gender}</td>
              <td>{student.percentage}</td>
              <td>
                <button className="btn btn-success" onClick={() => confirmAdmission(student)}>
                  Confirm Admission
                </button>
                <button className="btn btn-danger ml-2" onClick={() => deleteStudent(student.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentWhoFilledAdmissionForm;
