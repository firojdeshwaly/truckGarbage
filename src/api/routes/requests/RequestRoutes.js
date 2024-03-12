const express = require('express');
const router = express.Router();
const RequestController = require('./RequestController');

const { validate } = require('../../util/validations');
const validations = require('./RequestValidations');
const { verifyToken } = require('../../util/auth');






router.post('/create-request', verifyToken, RequestController.createRequest);
router.post('/cancel-request', verifyToken, RequestController.cancelRequest);
router.post('/accept-request', verifyToken, RequestController.acceptRequest);
router.post('/decline-request', verifyToken, RequestController.declineRequest);
router.post('/create-payment', verifyToken, RequestController.createPayment);
router.post('/confirm-payment', verifyToken, RequestController.confirmPayment);
router.get('/request-list', verifyToken, RequestController.requestList);
router.get('/nearest-yards', verifyToken, RequestController.nearestYards);


















// router.get('/trainerslist', verifyToken, RequestController.TrainersList);
router.get('/get-filters', verifyToken, RequestController.Filter);
router.get('/reset-filters', verifyToken, RequestController.ResetFilter);

router.get('/searchtrainer', verifyToken, RequestController.searchTrainer);
router.get('/session-list', verifyToken, RequestController.sessionList);
router.get('/upcoming-session', verifyToken, RequestController.UpcomingSession);
router.get('/trainer-session-list', verifyToken, RequestController.TrainerSessionList);
router.post('/create-session', verifyToken, RequestController.createSession);
//router.post('/session-location', verifyToken, RequestController.SessionLocation);
router.post('/edit-session', verifyToken, RequestController.editSession);
router.get('/work-with-trainer', verifyToken, RequestController.workWithTrainer);
router.post('/book-session', verifyToken, RequestController.Book);
router.get('/check-slot', verifyToken, RequestController.CheckSlot);
router.post('/add-review', verifyToken, RequestController.AddReview);


//---------------------------------------------------My Bookings-------------------------------------------------


router.get('/sent-requests', verifyToken, RequestController.sentRequests);
router.get('/ongoing-sessions', verifyToken, RequestController.ongoingSessions);
router.get('/completed-sessions', verifyToken, RequestController.completedSessions);
router.get('/booking-details', verifyToken, RequestController.BookingDetails);
router.post('/cancel-session', verifyToken, RequestController.CancelSession);
router.post('/start-session', verifyToken, RequestController.StartSession);
router.post('/confirm-session', verifyToken, RequestController.ConfirmSession);
router.get('/reviews', verifyToken, RequestController.Reviews);
router.get('/tracking-details', verifyToken, RequestController.TrackingDetails);
router.get('/tracking-profile', verifyToken, RequestController.TrackingProfile);

router.get('/payment-history', verifyToken, RequestController.PaymentHistory);
router.post('/add-bank', verifyToken, RequestController.AddBank);
router.get('/make-default-bank', verifyToken, RequestController.DefaultBank);
router.get('/delete-bank', verifyToken, RequestController.DeleteBank);
router.get('/bank-list', verifyToken, RequestController.BankList);

router.post('/create-group', verifyToken, RequestController.createGroup);
router.get('/delete-chat', verifyToken, RequestController.DeleteChat);
router.get('/add-members-list', verifyToken, RequestController.AddMembersList);
router.get('/chat-screen-individual', verifyToken, RequestController.ChatScreenInd);
router.get('/chat-screen-group', verifyToken, RequestController.ChatScreenGroup);



router.post('/make-call', RequestController.MakeCall);
router.get('/accessToken-voice', verifyToken, RequestController.AccessTokenVoice);
router.get('/accessToken-video', verifyToken, RequestController.AccessTokenVideo);
router.get('/reject-video-call', verifyToken, RequestController.RejectVideoCall);


router.get('/test', RequestController.Test);


module.exports = router;
