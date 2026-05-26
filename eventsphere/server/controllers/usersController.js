import User from '../models/User.js';
import Sponsor from '../models/Sponsor.js';

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let sponsorProfile = null;
    if (user.role === 'sponsor') {
      sponsorProfile = await Sponsor.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      data: {
        user,
        sponsorProfile
      },
      message: 'Profile fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update simple fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.avatar) user.avatar = req.body.avatar;

    await user.save();

    // If role is sponsor, update Sponsor profile details
    let sponsorProfile = null;
    if (user.role === 'sponsor' && req.body.sponsorDetails) {
      sponsorProfile = await Sponsor.findOne({ userId: user._id });
      if (sponsorProfile) {
        const { companyName, logo, industry, budgetRange, interests, previousEvents } = req.body.sponsorDetails;
        if (companyName) sponsorProfile.companyName = companyName;
        if (logo !== undefined) sponsorProfile.logo = logo;
        if (industry) sponsorProfile.industry = industry;
        if (budgetRange) sponsorProfile.budgetRange = budgetRange;
        if (interests) sponsorProfile.interests = interests;
        if (previousEvents) sponsorProfile.previousEvents = previousEvents;

        await sponsorProfile.save();
      }
    }

    res.json({
      success: true,
      data: {
        user,
        sponsorProfile
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users,
      message: 'Users list retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a role'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    // If role is changed to sponsor and Sponsor profile doesn't exist, create it
    if (role === 'sponsor') {
      const exists = await Sponsor.findOne({ userId: user._id });
      if (!exists) {
        await Sponsor.create({
          userId: user._id,
          companyName: `${user.name}'s Company`,
          industry: 'Technology',
          budgetRange: '$5,000 - $10,000',
          interests: ['Hackathon', 'Workshop']
        });
      }
    }

    res.json({
      success: true,
      data: user,
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    next(error);
  }
};
