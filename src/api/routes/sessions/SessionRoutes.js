const express = require('express');
const router = express.Router();
const SessionController = require('./SessionController');

const { validate } = require('../../util/validations');
const validations = require('./SessionValidations');
const { verifyToken } = require('../../util/auth');



router.get('/trainerslist', verifyToken, SessionController.TrainersList);
router.get('/get-filters', verifyToken, SessionController.Filter);
router.get('/reset-filters', verifyToken, SessionController.ResetFilter);

router.get('/searchtrainer', verifyToken, SessionController.searchTrainer);
router.get('/session-list', verifyToken, SessionController.sessionList);
router.get('/upcoming-session', verifyToken, SessionController.UpcomingSession);
router.get('/trainer-session-list', verifyToken, SessionController.TrainerSessionList);
router.post('/create-session', verifyToken, SessionController.createSession);
//router.post('/session-location', verifyToken, SessionController.SessionLocation);
router.post('/edit-session', verifyToken, SessionController.editSession);
router.get('/work-with-trainer', verifyToken, SessionController.workWithTrainer);
router.post('/book-session', verifyToken, SessionController.Book);
router.get('/check-slot', verifyToken, SessionController.CheckSlot);
router.post('/add-review', verifyToken, SessionController.AddReview);


//---------------------------------------------------My Bookings-------------------------------------------------


router.get('/sent-requests', verifyToken, SessionController.sentRequests);
router.get('/ongoing-sessions', verifyToken, SessionController.ongoingSessions);
router.get('/completed-sessions', verifyToken, SessionController.completedSessions);
router.get('/booking-details', verifyToken, SessionController.BookingDetails);
router.post('/cancel-session', verifyToken, SessionController.CancelSession);
router.post('/start-session', verifyToken, SessionController.StartSession);
router.post('/confirm-session', verifyToken, SessionController.ConfirmSession);
router.get('/reviews', verifyToken, SessionController.Reviews);
router.get('/tracking-details', verifyToken, SessionController.TrackingDetails);
router.get('/tracking-profile', verifyToken, SessionController.TrackingProfile);

router.get('/payment-history', verifyToken, SessionController.PaymentHistory);
router.post('/add-bank', verifyToken, SessionController.AddBank);
router.get('/make-default-bank', verifyToken, SessionController.DefaultBank);
router.get('/delete-bank', verifyToken, SessionController.DeleteBank);
router.get('/bank-list', verifyToken, SessionController.BankList);

router.post('/create-group', verifyToken, SessionController.createGroup);
router.get('/delete-chat', verifyToken, SessionController.DeleteChat);
router.get('/add-members-list', verifyToken, SessionController.AddMembersList);
router.get('/chat-screen-individual', verifyToken, SessionController.ChatScreenInd);
router.get('/chat-screen-group', verifyToken, SessionController.ChatScreenGroup);



router.post('/make-call', SessionController.MakeCall);
router.get('/accessToken-voice', verifyToken, SessionController.AccessTokenVoice);
router.get('/accessToken-video', verifyToken, SessionController.AccessTokenVideo);
router.get('/reject-video-call', verifyToken, SessionController.RejectVideoCall);


router.get('/test', SessionController.Test);


module.exports = router;
