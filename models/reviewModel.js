// review / rating / createAt / ref to tour / ref to user
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review can not be empty!'] },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: { type: Date, default: Date.now() },
    tour: {
      // This use for refer to _id of Tour. to populate it to this(ReviewSchema)
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      ////////////////////////////////////
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // when have vitual property(Field that is not stored in database but calculated using some other value).
    // So, want this to also show up whenever there is an output.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// This use to set tour and user to { unique: true } --> means 1 user can only review once time on each tour.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // Populate tour and user in Review.
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// .statics --> Statics are pretty much the same as methods but allow for defining functions that exist directly on your Model.
reviewSchema.statics.calAverageRatings = async function (tourId) {
  // use statics method because want to call .aggregate on this(Review model).
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  // if (stats.length > 0) {
  //   await Tour.findByIdAndUpdate(tourId, {
  //     ratingsQuantity: stats[0].nRating,
  //     ratingsAverage: stats[0].avgRating,
  //   });
  // } else {
  //   await Tour.findByIdAndUpdate(tourId, {
  //     ratingsQuantity: 0,
  //     ratingsAverage: 4.5,
  //   });
  // }

  // This code same as if else above
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0]?.nRating || 0,
    ratingsAverage: stats[0]?.avgRating || 4.5,
  });
};

// post doesnt have next aggrument.
reviewSchema.post('save', function () {
  // this point to current review
  this.constructor.calAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
