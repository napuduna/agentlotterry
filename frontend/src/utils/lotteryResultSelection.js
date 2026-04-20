const hasResultContent = (result) => Boolean(
  result
  && (
    (result.headline && result.headline !== '-')
    || result.firstPrize
    || result.twoBottom
    || result.threeTop
    || result.resultPublishedAt
    || (result.numbers || []).some((item) => item?.value)
  )
);

const getResultChronologyTime = (result) => {
  const drawAt = result?.drawAt ? new Date(result.drawAt).getTime() : 0;
  if (Number.isFinite(drawAt) && drawAt > 0) {
    return drawAt;
  }

  const roundCodeMatch = String(result?.roundCode || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (roundCodeMatch) {
    return Date.UTC(
      Number(roundCodeMatch[1]),
      Number(roundCodeMatch[2]) - 1,
      Number(roundCodeMatch[3]),
      12,
      0,
      0
    );
  }

  const publishedAt = result?.resultPublishedAt ? new Date(result.resultPublishedAt).getTime() : 0;
  return Number.isFinite(publishedAt) ? publishedAt : 0;
};

const sortResultsByLatestFirst = (results = []) => [...results].sort((left, right) => {
  const leftDate = getResultChronologyTime(left);
  const rightDate = getResultChronologyTime(right);
  return rightDate - leftDate;
});

const getLatestResultCandidate = (candidates = []) => {
  const validCandidates = candidates.filter(hasResultContent);
  if (!validCandidates.length) {
    return null;
  }

  return sortResultsByLatestFirst(validCandidates)[0];
};

export {
  hasResultContent,
  getResultChronologyTime,
  sortResultsByLatestFirst,
  getLatestResultCandidate
};
