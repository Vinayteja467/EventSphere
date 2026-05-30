import Sponsorship from '../models/Sponsorship.js';
import Sponsor from '../models/Sponsor.js';
import Event from '../models/Event.js';

// @desc    Submit a sponsorship proposal to an organizer
// @route   POST /api/sponsorships/offer
// @access  Private (Sponsor only)
export const createSponsorshipOffer = async (req, res, next) => {
  try {
    const { eventId, budget, message, perksRequested } = req.body;

    if (!eventId || !budget || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId, budget, and message'
      });
    }

    // 1. Locate Sponsor profile associated with the authenticated User
    let sponsor = await Sponsor.findOne({ userId: req.user._id });
    if (!sponsor) {
      sponsor = await Sponsor.findOne({});
      if (!sponsor) {
        return res.status(404).json({
          success: false,
          message: 'Sponsor profile not found. Please onboarding first.'
        });
      }
    }

    // 2. Validate event existence
    const event = await Event.findById(eventId).populate('organizer', 'name email');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // 3. Prevent duplicate offers
    const existingOffer = await Sponsorship.findOne({ eventId, sponsorId: sponsor._id });
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a sponsorship offer for this event.'
      });
    }

    // 4. Create Sponsorship предложение
    const offer = await Sponsorship.create({
      eventId,
      sponsorId: sponsor._id,
      budget,
      message,
      perksRequested: perksRequested || [],
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: offer,
      organizerName: event.organizer?.name || 'Organizer',
      message: `Offer sent successfully to ${event.organizer?.name || 'Organizer'}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics and active proposal states for the logged-in Sponsor
// @route   GET /api/sponsor/stats
// @access  Private (Sponsor only)
export const getSponsorStats = async (req, res, next) => {
  try {
    // 1. Locate Sponsor profile
    let sponsor = await Sponsor.findOne({ userId: req.user._id });
    if (!sponsor) {
      const totalBrowsed = await Event.countDocuments({ status: 'published' });
      return res.json({
        success: true,
        data: {
          stats: {
            browsed: totalBrowsed,
            offered: 0,
            accepted: 0,
            reach: 0
          },
          offers: []
        },
        message: 'Default stats returned (no active sponsor profile found)'
      });
    }

    // 2. Compute statistics
    const browsed = await Event.countDocuments({ status: 'published' });
    const offered = await Sponsorship.countDocuments({ sponsorId: sponsor._id });
    const accepted = await Sponsorship.countDocuments({ sponsorId: sponsor._id, status: 'accepted' });

    // 3. Compute total audience reach (sum of capacities of events where an offer is sent)
    const activeOffers = await Sponsorship.find({ sponsorId: sponsor._id }).populate('eventId', 'capacity');
    const reach = activeOffers.reduce((sum, offer) => {
      if (offer.eventId) {
        return sum + (offer.eventId.capacity || 0);
      }
      return sum;
    }, 0);

    res.json({
      success: true,
      data: {
        stats: {
          browsed,
          offered,
          accepted,
          reach
        },
        offers: activeOffers
      },
      message: 'Sponsor dashboard analytics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sponsorship offers sent to the Organizer's events
// @route   GET /api/sponsorships/organizer
// @access  Private (Organizer only)
export const getOrganizerSponsorships = async (req, res, next) => {
  try {
    // 1. Find all events created by the logged-in organizer
    const myEvents = await Event.find({ organizer: req.user._id });
    const eventIds = myEvents.map(e => e._id);

    // 2. Find all sponsorship proposals sent to these events
    const proposals = await Sponsorship.find({ eventId: { $in: eventIds } })
      .populate('eventId', 'title capacity bannerImage')
      .populate({
        path: 'sponsorId',
        populate: { path: 'userId', select: 'name email avatar' }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: proposals,
      message: 'Organizer sponsorship proposals retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept or Decline a sponsorship proposal
// @route   PATCH /api/sponsorships/:id/status
// @access  Private (Organizer only)
export const updateSponsorshipStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (accepted or rejected)'
      });
    }

    // 1. Locate the sponsorship bid
    const proposal = await Sponsorship.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Sponsorship proposal not found'
      });
    }

    // 2. Verify the requesting user is the organizer of the event
    const event = await Event.findById(proposal.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event associated with this proposal was not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this sponsorship offer'
      });
    }

    // 3. Update status
    proposal.status = status;
    await proposal.save();

    // 4. If accepted, register the sponsor inside the Event's sponsors roster
    if (status === 'accepted') {
      await Event.findByIdAndUpdate(proposal.eventId, {
        $addToSet: { sponsors: proposal.sponsorId }
      });
    } else {
      // If rejected, clean up sponsor from event just in case
      await Event.findByIdAndUpdate(proposal.eventId, {
        $pull: { sponsors: proposal.sponsorId }
      });
    }

    res.json({
      success: true,
      data: proposal,
      message: `Sponsorship proposal has been successfully ${status}!`
    });
  } catch (error) {
    next(error);
  }
};
