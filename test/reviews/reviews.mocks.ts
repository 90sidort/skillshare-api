export const newReviewRating = {
  title: 'New test review rating only',
  rating: 8,
  reviewedId: 111100,
};

export const newReviewText = {
  title: 'New test review with text',
  rating: 8,
  reviewedId: 11199,
  review:
    'This is a review body. This review is just a test review, so do not think much of it.',
};

export const newReviewInvalid = {
  title: 'New test review with text'.repeat(100),
  rating: 12,
  reviewedId: 'test',
  review: 'a',
};
