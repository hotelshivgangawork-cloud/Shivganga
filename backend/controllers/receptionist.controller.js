import Receptionist from "../models/Receptionist.model.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import bcrypt from "bcryptjs";
import { sendReceptionistCredentialsMail } from "../services/mail.service.js";

const generateEmployeeId = async (firstName) => {
  let employeeId;
  let exists = true;

  while (exists) {
    const random = Math.floor(10000 + Math.random() * 90000);
    employeeId = `${firstName.toLowerCase()}-${random}`;
    exists = await Receptionist.findOne({ employeeId });
  }

  return employeeId;
};


export const createReceptionist = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
        basicSalary,
      role = "receptionist"
    } = req.body;

    const exists = await Receptionist.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Staff member already exists"
      });
    }
if (basicSalary === undefined) {
  return res.status(400).json({
    success: false,
    message: "Basic salary is required"
  });
}
    // receptionist ke liye password mandatory
    if (role === "receptionist" && !password) {
      return res.status(400).json({
        success: false,
        message: "Password is required for receptionist login"
      });
    }

    const employeeId = await generateEmployeeId(firstName);

    const staffData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      role,
      employeeId,
      basicSalary
    };

    if (password) {
      staffData.password = await bcrypt.hash(password, 10);
    }

    const staff = await Receptionist.create(staffData);

    // 📧 credentials sirf receptionist ko
    if (role === "receptionist") {
      await sendReceptionistCredentialsMail({
        fullName: `${firstName} ${lastName}`,
        email,
        password,
        employeeId
      });
    }

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: {
        id: staff._id,
        employeeId,
        role: staff.role
      }
    });
  } catch (error) {
    next(error);
  }
};



export const updateReceptionist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await Receptionist.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
      isActive,
      basicSalary
    } = req.body;

    if (email && email !== staff.email) {
      const emailExists = await Receptionist.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email already in use"
        });
      }
      staff.email = email;
    }

    if (firstName) staff.firstName = firstName;
    if (lastName) staff.lastName = lastName;
    if (phoneNumber) staff.phoneNumber = phoneNumber;
    if (role) staff.role = role;
    if (typeof isActive === "boolean") staff.isActive = isActive;

    if (basicSalary !== undefined) {
      staff.basicSalary = Number(basicSalary);
    }

    if (password) {
      staff.password = await bcrypt.hash(password, 10);

      await sendReceptionistCredentialsMail({
        fullName: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        password,
        employeeId: staff.employeeId
      });
    }

    await staff.save();

    res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: {
        id: staff._id,
        employeeId: staff.employeeId,
        role: staff.role
      }
    });

  } catch (error) {
    next(error);
  }
};



export const deleteReceptionist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staff = await Receptionist.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }

    await staff.deleteOne();

    res.status(200).json({
      success: true,
      message: "Staff deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};


export const getAllStaff = async (req, res, next) => {
  try {
    const staffList = await Receptionist.find()
      .select(
        "firstName lastName employeeId email phoneNumber username role isActive basicSalary"
      )
      .sort({ createdAt: -1 });

    const formatted = staffList.map((s) => ({
      id: s._id,
      name: `${s.firstName} ${s.lastName}`,
      employeeId: s.employeeId,
      email: s.email,
      mobile: s.phoneNumber,
      username: s.username || "-",
      role: s.role,
      basicSalary: s.basicSalary,
      isActive: s.isActive
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};
