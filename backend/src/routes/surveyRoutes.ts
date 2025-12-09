import { Router } from 'express';
import { createSurvey, deleteSurvey, getSurveyAdmin, getSurveyPublic, getMyCompletedSurveys, getUserCompletedSurveys, listSurveysAdmin, listSurveysUser, resultsPublic, updateSurvey, votePublic } from '../controllers/surveysController';
import { jwtMiddleware, requireAdmin } from '../middleware/auth';

export const surveyRouter = Router();

// User endpoints (перед параметризованими маршрутами)
surveyRouter.get('/list', jwtMiddleware, listSurveysUser);
surveyRouter.get('/my/completed', jwtMiddleware, getMyCompletedSurveys);

// Admin
surveyRouter.get('/', jwtMiddleware, requireAdmin, listSurveysAdmin);
surveyRouter.post('/', jwtMiddleware, requireAdmin, createSurvey);
surveyRouter.get('/user/:userId/completed', jwtMiddleware, requireAdmin, getUserCompletedSurveys);
surveyRouter.get('/:id', jwtMiddleware, requireAdmin, getSurveyAdmin);
surveyRouter.put('/:id', jwtMiddleware, requireAdmin, updateSurvey);
surveyRouter.delete('/:id', jwtMiddleware, requireAdmin, deleteSurvey);

// Public
surveyRouter.get('/public/:publicId', getSurveyPublic);
surveyRouter.post('/public/:publicId/vote', jwtMiddleware, votePublic);
surveyRouter.get('/public/:publicId/results', jwtMiddleware, resultsPublic);
