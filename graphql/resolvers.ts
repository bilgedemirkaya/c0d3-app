import { Request } from 'express'
import db from '../helpers/dbload'
import { login, logout, signup } from '../helpers/controllers/authController'
import _ from 'lodash'

const { User, Submission, Lesson, UserLesson, Alert } = db

type Submission = {
  lessonId: string
}

export default {
  Query: {
    lessons() {
      return Lesson.findAll({
        include: ['challenges'],
        order: [['order', 'ASC']]
      })
    },
    submissions(_parent: void, arg: Submission, _context: { req: Request }) {
      const { lessonId } = arg
      return Submission.findAll({
        where: {
          status: 'open',
          lessonId
        }
      })
    },
    async session(_parent: void, _args: void, context: { req: Request }) {
      const userId = _.get(context, 'req.session.userId', false)

      if (!userId) {
        return null
      }

      // FYI: The reason we are querying with parallelized promises:
      // https://github.com/garageScript/c0d3-app/wiki/Sequelize-Query-Performance
      const [user, submissions, lessonStatus, alerts] = await Promise.all([
        User.findOne({ where: { id: userId } }),
        Submission.findAll({
          where: { userId },
          include: [{ model: User, as: 'reviewer' }]
        }),
        UserLesson.findAll({ where: { userId } }),
        Alert.findAll()
      ])

      if (!user) {
        return null
      }

      return {
        user,
        submissions,
        lessonStatus,
        alerts
      }
    }
  },

  Mutation: {
    login,
    logout,
    signup
  }
}
