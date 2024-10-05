export const handleSort = (sortMethod) => {
  switch (sortMethod) {
    case "ascPrice":
      return (a, b) => a.price - b.price;

      break;
    case "descPrice":
      return (a, b) => b.price - a.price;

      break;
    case "ascName":
      return (a, b) => (a.title > b.title ? 1 : -1);

      break;
    case "descName":
      return (a, b) => (b.title > a.title ? 1 : -1);

      break;
    case "descRating":
      return (a, b) => b.rating - a.rating;

      break;

    default:
      break;
  }
};
