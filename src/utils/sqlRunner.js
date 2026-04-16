import initSqlJs from 'sql.js';

let db = null;
let sqlPromise = null;

const SEED_SQL = `
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  budget REAL,
  location TEXT
);

INSERT INTO departments VALUES (1, 'Engineering', 500000, 'San Francisco');
INSERT INTO departments VALUES (2, 'Marketing', 200000, 'New York');
INSERT INTO departments VALUES (3, 'Sales', 300000, 'Chicago');
INSERT INTO departments VALUES (4, 'HR', 150000, 'San Francisco');
INSERT INTO departments VALUES (5, 'Finance', 250000, 'New York');
INSERT INTO departments VALUES (6, 'Product', 400000, 'San Francisco');
INSERT INTO departments VALUES (7, 'Design', 180000, 'Austin');
INSERT INTO departments VALUES (8, 'DevOps', 350000, 'Remote');

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  salary REAL,
  hire_date TEXT,
  email TEXT,
  manager_id INTEGER,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

INSERT INTO employees VALUES (1, 'Alice Johnson', 1, 130000, '2019-03-15', 'alice@company.com', NULL);
INSERT INTO employees VALUES (2, 'Bob Smith', 1, 120000, '2020-06-01', 'bob@company.com', 1);
INSERT INTO employees VALUES (3, 'Carol Williams', 2, 95000, '2021-01-10', 'carol@company.com', NULL);
INSERT INTO employees VALUES (4, 'David Brown', 1, 115000, '2020-09-20', 'david@company.com', 1);
INSERT INTO employees VALUES (5, 'Eve Davis', 3, 88000, '2022-02-14', 'eve@company.com', NULL);
INSERT INTO employees VALUES (6, 'Frank Miller', 3, 92000, '2021-07-05', 'frank@company.com', 5);
INSERT INTO employees VALUES (7, 'Grace Wilson', 4, 78000, '2023-01-20', 'grace@company.com', NULL);
INSERT INTO employees VALUES (8, 'Henry Taylor', 5, 105000, '2020-11-30', 'henry@company.com', NULL);
INSERT INTO employees VALUES (9, 'Ivy Anderson', 1, 140000, '2018-05-22', 'ivy@company.com', 1);
INSERT INTO employees VALUES (10, 'Jack Thomas', 6, 125000, '2019-08-12', 'jack@company.com', NULL);
INSERT INTO employees VALUES (11, 'Karen Lee', 2, 88000, '2022-04-18', 'karen@company.com', 3);
INSERT INTO employees VALUES (12, 'Leo Martinez', 7, 95000, '2021-03-25', 'leo@company.com', NULL);
INSERT INTO employees VALUES (13, 'Mia Garcia', 8, 118000, '2020-01-08', 'mia@company.com', NULL);
INSERT INTO employees VALUES (14, 'Nathan Clark', 1, 110000, '2021-11-15', 'nathan@company.com', 1);
INSERT INTO employees VALUES (15, 'Olivia Rodriguez', 6, 115000, '2022-06-30', 'olivia@company.com', 10);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  city TEXT,
  country TEXT,
  created_at TEXT
);

INSERT INTO customers VALUES (1, 'Acme Corp', 'contact@acme.com', 'New York', 'USA', '2022-01-15');
INSERT INTO customers VALUES (2, 'Globex Inc', 'info@globex.com', 'London', 'UK', '2022-03-22');
INSERT INTO customers VALUES (3, 'Initech', 'support@initech.com', 'Austin', 'USA', '2022-05-10');
INSERT INTO customers VALUES (4, 'Umbrella Corp', 'sales@umbrella.com', 'Tokyo', 'Japan', '2022-07-01');
INSERT INTO customers VALUES (5, 'Wayne Enterprises', 'bruce@wayne.com', 'Gotham', 'USA', '2022-08-20');
INSERT INTO customers VALUES (6, 'Stark Industries', 'tony@stark.com', 'Malibu', 'USA', '2022-09-05');
INSERT INTO customers VALUES (7, 'Cyberdyne Systems', 'info@cyberdyne.com', 'Berlin', 'Germany', '2022-10-12');
INSERT INTO customers VALUES (8, 'Soylent Corp', 'hello@soylent.com', 'Mumbai', 'India', '2023-01-18');

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock INTEGER
);

INSERT INTO products VALUES (1, 'Widget Pro', 'Electronics', 49.99, 150);
INSERT INTO products VALUES (2, 'Gadget X', 'Electronics', 99.99, 75);
INSERT INTO products VALUES (3, 'Super Cable', 'Accessories', 12.99, 500);
INSERT INTO products VALUES (4, 'Mega Battery', 'Electronics', 29.99, 200);
INSERT INTO products VALUES (5, 'Smart Cover', 'Accessories', 24.99, 300);
INSERT INTO products VALUES (6, 'Cloud Storage Plan', 'Services', 9.99, 9999);
INSERT INTO products VALUES (7, 'Dev Toolkit', 'Software', 199.99, 50);
INSERT INTO products VALUES (8, 'Monitor Stand', 'Accessories', 79.99, 120);
INSERT INTO products VALUES (9, 'Keyboard Elite', 'Electronics', 149.99, 85);
INSERT INTO products VALUES (10, 'Mouse Precision', 'Electronics', 69.99, 110);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  total REAL,
  order_date TEXT,
  status TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO orders VALUES (1, 1, 1, 10, 499.90, '2023-01-15', 'delivered');
INSERT INTO orders VALUES (2, 1, 3, 50, 649.50, '2023-01-20', 'delivered');
INSERT INTO orders VALUES (3, 2, 2, 5, 499.95, '2023-02-10', 'delivered');
INSERT INTO orders VALUES (4, 3, 7, 2, 399.98, '2023-02-28', 'delivered');
INSERT INTO orders VALUES (5, 4, 1, 20, 999.80, '2023-03-05', 'shipped');
INSERT INTO orders VALUES (6, 5, 9, 3, 449.97, '2023-03-15', 'shipped');
INSERT INTO orders VALUES (7, 2, 4, 15, 449.85, '2023-04-01', 'processing');
INSERT INTO orders VALUES (8, 6, 10, 8, 559.92, '2023-04-10', 'processing');
INSERT INTO orders VALUES (9, 1, 6, 100, 999.00, '2023-04-20', 'delivered');
INSERT INTO orders VALUES (10, 3, 5, 25, 624.75, '2023-05-01', 'shipped');
INSERT INTO orders VALUES (11, 7, 8, 4, 319.96, '2023-05-15', 'delivered');
INSERT INTO orders VALUES (12, 8, 2, 10, 999.90, '2023-06-01', 'processing');
INSERT INTO orders VALUES (13, 4, 3, 100, 1299.00, '2023-06-10', 'shipped');
INSERT INTO orders VALUES (14, 5, 7, 1, 199.99, '2023-06-20', 'delivered');
INSERT INTO orders VALUES (15, 6, 1, 30, 1499.70, '2023-07-01', 'processing');
`;

async function initDb() {
  if (db) return db;
  if (sqlPromise) return sqlPromise;

  sqlPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });
    db = new SQL.Database();
    db.run(SEED_SQL);
    return db;
  })();

  return sqlPromise;
}

/**
 * Run SQL code against the in-browser SQLite database.
 * Returns { results: Array<{ columns, values }>, error, duration }
 */
export async function runSQL(code) {
  const startTime = performance.now();

  try {
    const database = await initDb();
    // Split multiple statements and execute
    const results = database.exec(code);
    const duration = (performance.now() - startTime).toFixed(2);
    return { results, error: null, duration };
  } catch (e) {
    const duration = (performance.now() - startTime).toFixed(2);
    return { results: [], error: e.message, duration };
  }
}

/** Reset the database to initial state */
export async function resetSqlDb() {
  if (db) {
    db.close();
    db = null;
    sqlPromise = null;
  }
  return initDb();
}
