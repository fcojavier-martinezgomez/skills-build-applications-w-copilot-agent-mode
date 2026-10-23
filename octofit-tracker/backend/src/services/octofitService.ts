import { Activity, Team, User, Workout } from '../models/index.js';
import { Types } from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' ||
    !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes < 1
  ) {
    throw Object.assign(new Error('Activity input is invalid'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))
  ) {
    throw Object.assign(new Error('Team input is invalid'), { status: 400 });
  }

  const existingMembers = await User.find({ _id: { $in: members } }).select('_id').lean();
  if (existingMembers.length !== new Set(members).size) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select('type').lean(),
    Workout.find().lean(),
  ]);

  const activityFocus = (type: string) => {
    const normalizedType = type.trim().toLowerCase();
    if (['run', 'cycle', 'cycling', 'walk'].includes(normalizedType)) return 'endurance';
    return normalizedType;
  };
  const activityCounts = new Map<string, number>();
  for (const activity of activities) {
    const focus = activityFocus(activity.type);
    activityCounts.set(focus, (activityCounts.get(focus) ?? 0) + 1);
  }

  const goal = user.fitnessGoal.trim().toLowerCase();
  const rankedWorkouts = workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const activityCount = activityCounts.get(focus) ?? 0;
      const goalMatch = focus === goal;
      return { workout, activityCount, goalMatch, score: activityCount + (goalMatch ? 2 : 0) };
    })
    .sort((first, second) => second.score - first.score || (first.workout.title ?? '').localeCompare(second.workout.title ?? ''));

  const recommendation = rankedWorkouts[0];
  if (!recommendation) return [];

  const matchingActivity = activities.find((activity) => activityFocus(activity.type) === recommendation.workout.focus.trim().toLowerCase());
  const reason = matchingActivity
    ? `Recommended for your ${goal} goal and recent ${matchingActivity.type} activity.`
    : recommendation.goalMatch
      ? `Recommended for your ${goal} fitness goal.`
      : 'Recommended based on your recent activity.';

  return [{ ...recommendation.workout, reason }];
}

export { User };
