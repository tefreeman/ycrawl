# Restaurant Data Extractor

This project is designed to extract and store detailed restaurant information from various sources, including Grubhub, Yelp, and Waitr. The application uses Typescript and MongoDB to fetch, process, and store restaurant data in a structured format for further analysis.

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Running Grubhub Extractor](#running-grubhub-extractor)
  - [Running Yelp Extractor](#running-yelp-extractor)
  - [Running Waitr Extractor](#running-waitr-extractor)
- [License](#license)

## Project Structure

```text
src/
├── database.ts            # Handles the connection to the MongoDB database
├── grubhub-extractor.ts   # Extractor for Grubhub data
├── helpers.ts             # Helper methods used across extractors
├── main.ts                # Entry point for the application
├── max-requests.ts        # Utility to manage API request rate limits
├── menu.ts                # Class to handle menu data
├── scratch.ts             # Script to manually test extractors
├── waitr-extractor.ts     # Extractor for Waitr data
├── yelp-detailed-extractor.ts  # Extractor for Yelp detailed data
├── yelp-search-extractor.ts    # Extractor for Yelp search results
```

## Getting Started

### Prerequisites

- Node.js (version 12 or higher)
- MongoDB instance (local or remote)

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/yourusername/restaurant-data-extractor.git
   cd restaurant-data-extractor
   ```
   
2. **Install dependencies**
   ```sh
   npm install
   ```

## Configuration

Configure your MongoDB connection by setting the correct parameters in the `Database` class within `src/database.ts`:

```typescript
const Db = new Database('your-mongodb-host', 'your-mongodb-port', 'your-username', 'your-password');
```

## Usage

You can run different parts of the extractor by invoking specific methods in the `main.ts` file or using the `scratch.ts` for testing. Below are some examples:

### Running Grubhub Extractor

Edit `main.ts` to only run the Grubhub extractor:

```typescript
async function run_grubhub(loc: { lon: number, lat: number }) {
  Db.init_client().then(() => {
    const col = Db.get_collection('places', 'grubhub');
    const test = new GrubhubExtractor(loc, col, 500);
  });
}

run_grubhub({ lon: -86.83403114318855, lat: 33.44113529354669 }).then(() => {
   console.log('Grubhub extraction done');
});
```

Then execute:
```sh
npm run start
```

### Running Yelp Extractor

Edit `main.ts` to only run the Yelp extractor:

```typescript
async function run_yelp() {
  await Db.init_client();
  const restaurantCol = Db.get_collection('places', 'yelp');
  const test = new YelpSearchExtractor({
    r_lon: -86.39471041010745,
    r_lat: 33.79718499296451,
    l_lon: -87.21319185541995,
    l_lat: 33.10972274220187
  }, restaurantCol, 1500);
  test.start()
}

run_yelp().then(() => {
   console.log('Yelp extraction done');
});
```

Then execute:
```sh
npm run start
```

### Running Waitr Extractor

Edit `scratch.ts` for a quick test with Waitr extractor:

```typescript
const Db = new Database('71.82.19.242', '27017', 'admin', '***REMOVED***');

Db.init_client().then(() => {
  const col = Db.get_collection('places', 'waitr');
  new WaitrExtractor({
    lon: -86.83403114318855,
    lat: 33.44113529354669,
  }, col, 4000);
});
```

Then execute:
```sh
npm run start
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
