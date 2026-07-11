const request = require('supertest');
const fs = require('fs');
const path = require('path');

let app;
let db;
let serverInstance;
let createdEntryCodes = {};
let createdCategoryCodes = {};
let generalCategoryCode = '';

const testDbPath = path.join(__dirname, '..', 'test_database.sqlite');


beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const server = require('../server');
  app = server.app;
  db = server.db;
  serverInstance = app.listen(3001);

  let retries = 5;
  while (retries > 0) {
    const res = await request(app).get('/api/categories');
    if (res.body && res.body.data) {
        const generalCat = res.body.data.find(cat => cat.name === 'General');
        if (generalCat) {
            generalCategoryCode = generalCat.code;
            break;
        }
    }
    console.log("Waiting for 'General' category to be created...");
    await new Promise(resolve => setTimeout(resolve, 300));
    retries--;
  }

  if (!generalCategoryCode) {
    throw new Error("Could not find 'General' category during setup after 5 retries.");
  }
});

afterAll((done) => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    
    serverInstance.close(() => {
      if (fs.existsSync(testDbPath)) {
        try {
          fs.unlinkSync(testDbPath);
          console.log('Test database deleted.');
        } catch (unlinkErr) {
          console.error('Error deleting test database:', unlinkErr.message);
        }
      }
      done();
    });
  });
});


const fetchEntries = async () => {
  return await request(app).get('/api/entries');
};


const fetchCategories = async () => {
  return await request(app).get('/api/categories');
};


const fetchScansForDate = async (date) => {

  const [month, day, year] = date.split('/');
  const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return await request(app).get(`/api/scans/${formattedDate}`);
};


describe('API Endpoint Tests', () => {


  it('Task 1: Fetch initial list of entries', async () => {
    const res = await fetchEntries();
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual([]);
    console.log('Task 1: Fetch initial entries: pass');
  });


  it('Task 2: Create six entries and fetch list', async () => {
    const entryNames = ["Apple", "Banana", "Cherry", "Durian", "Eggplant", "Fig"];
    for (const name of entryNames) {
      const createRes = await request(app).post('/api/entry').send({ name });
      expect(createRes.statusCode).toEqual(200);
      createdEntryCodes[name] = createRes.body.data.code;
    }

    const fetchRes = await fetchEntries();
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(6);
    expect(fetchRes.body.total).toEqual(6);

    const names = fetchRes.body.data.map(e => e.name).sort();
    expect(names).toEqual(entryNames.sort());
    console.log('Task 2: Create entries and fetch: pass');
  });


  it('Task 3: Delete "Fig" entry and fetch list', async () => {
    const figCode = createdEntryCodes["Fig"];
    const deleteRes = await request(app).delete(`/api/entry/${figCode}`);
    expect(deleteRes.statusCode).toEqual(200);
    expect(deleteRes.body.message).toContain('Successfully deleted entry.');

    const fetchRes = await fetchEntries();
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(5);
    expect(fetchRes.body.total).toEqual(5);
    const names = fetchRes.body.data.map(e => e.name);
    expect(names).not.toContain("Fig");
    console.log('Task 3: Delete entry and fetch: pass');
  });


  it('Task 4: Edit "Cherry" to "Citrus" and fetch list', async () => {
    const cherryCode = createdEntryCodes["Cherry"];
    const editRes = await request(app).put(`/api/entry/${cherryCode}`).send({ name: "Citrus" });
    expect(editRes.statusCode).toEqual(200);
    expect(editRes.body.message).toContain('Successfully updated entry.');


    createdEntryCodes["Citrus"] = cherryCode;
    delete createdEntryCodes["Cherry"];

    const fetchRes = await fetchEntries();
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(5);
    const names = fetchRes.body.data.map(e => e.name);
    expect(names).toContain("Citrus");
    expect(names).not.toContain("Cherry");
    console.log('Task 4: Edit entry and fetch: pass');
  });


  it('Task 5: Fetch initial list of categories (should contain General)', async () => {
    const res = await fetchCategories();
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'General' })]));
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    console.log('Task 5: Fetch initial categories: pass');
    generalCategoryCode = res.body.data.find(c => c.name === 'General').code;
  });


  it('Task 6: Create six categories and fetch list', async () => {
    const categoryNames = ["Algebra", "Biology", "Calculus", "Dance", "Economics", "French"];
    for (const name of categoryNames) {
      const createRes = await request(app).post('/api/category').send({ name });
      expect(createRes.statusCode).toEqual(201);
      createdCategoryCodes[name] = createRes.body.data.code;
    }

    const fetchRes = await fetchCategories();
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(7);

    const names = fetchRes.body.data.map(c => c.name).sort();
    expect(names).toEqual(["General", ...categoryNames].sort());
    console.log('Task 6: Create categories and fetch: pass');
  });


  it('Task 7: Delete "French" category and fetch list', async () => {
    const frenchCode = createdCategoryCodes["French"];
    const deleteRes = await request(app).delete(`/api/category/${frenchCode}`);
    expect(deleteRes.statusCode).toEqual(200);
    expect(deleteRes.body.message).toContain('Successfully deleted category.');

    const fetchRes = await fetchCategories();
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(6);
    const names = fetchRes.body.data.map(c => c.name);
    expect(names).not.toContain("French");
    console.log('Task 7: Delete category and fetch: pass');
  });


  it('Task 8: Edit "Calculus" to "Chemistry" and fetch list', async () => {
    const calculusCode = createdCategoryCodes["Calculus"];
    const editRes = await request(app).put(`/api/category/${calculusCode}`).send({ name: "Chemistry" });
    expect(editRes.statusCode).toEqual(200);
    expect(editRes.body.message).toContain('Successfully updated category.');


    createdCategoryCodes["Chemistry"] = calculusCode;
    delete createdCategoryCodes["Calculus"];

    const fetchRes = await fetchCategories();
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(6);
    const names = fetchRes.body.data.map(c => c.name);
    expect(names).toContain("Chemistry");
    expect(names).not.toContain("Calculus");
    console.log('Task 8: Edit category and fetch: pass');
  });


  it('Task 9: Fetch scans for 01/11/2025 (initially empty)', async () => {
    const res = await fetchScansForDate('01/11/2025');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toEqual(0);
    console.log('Task 9: Fetch scans for 01/11/2025 (initial): pass');
  });


  it('Task 10: Create scans for 01/11/2025 and fetch list', async () => {
    const entryNamesToScan = ["Apple", "Banana", "Citrus", "Durian", "Eggplant"];
    const scanDate = '2025-01-11';
    const scanTime = '15:00:00'; // 3:00 PM

    for (const name of entryNamesToScan) {
      const entryCode = createdEntryCodes[name];
      const createRes = await request(app)
        .post('/api/scan/record')
        .send({
          code: entryCode,
          category_code: generalCategoryCode,
          date: scanDate,
          time: scanTime
        });
      expect(createRes.statusCode).toEqual(200);
    }

    const fetchRes = await fetchScansForDate('01/11/2025');
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(5);
    expect(fetchRes.body.total).toEqual(5);
    const scannedNames = fetchRes.body.data.map(s => s.entry_name).sort();
    expect(scannedNames).toEqual(entryNamesToScan.sort());
    fetchRes.body.data.forEach(scan => {
        expect(scan.category_name).toEqual('General');
    });
    console.log('Task 10: Create scans for 01/11/2025 and fetch: pass');
  });


  it('Task 11: Create scans for 01/12/2025 (Chemistry) and fetch list', async () => {
    const entryNamesToScan = ["Apple", "Banana", "Citrus", "Durian", "Eggplant"];
    const scanDate = '2025-01-12';
    const scanTime = '15:00:00'; // 3:00 PM
    const chemistryCode = createdCategoryCodes["Chemistry"];

    for (const name of entryNamesToScan) {
      const entryCode = createdEntryCodes[name];
      const createRes = await request(app)
        .post('/api/scan/record')
        .send({
          code: entryCode,
          category_code: chemistryCode,
          date: scanDate,
          time: scanTime
        });
      expect(createRes.statusCode).toEqual(200);
    }

    const fetchRes = await fetchScansForDate('01/12/2025');
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(5);
    expect(fetchRes.body.total).toEqual(5);
    const scannedNames = fetchRes.body.data.map(s => s.entry_name).sort();
    expect(scannedNames).toEqual(entryNamesToScan.sort());
     fetchRes.body.data.forEach(scan => {
        expect(scan.category_name).toEqual('Chemistry');
     });
    console.log('Task 11: Create scans for 01/12/2025 and fetch: pass');
  });


  it('Task 12: Delete "Chemistry" category and fetch scans for 01/12/2025 (category should be General)', async () => {
    const chemistryCode = createdCategoryCodes["Chemistry"];
    const deleteRes = await request(app).delete(`/api/category/${chemistryCode}`);
    expect(deleteRes.statusCode).toEqual(200);

    const fetchRes = await fetchScansForDate('01/12/2025');
    expect(fetchRes.statusCode).toEqual(200);
    expect(fetchRes.body.data).toHaveLength(5);
    expect(fetchRes.body.total).toEqual(5);


    fetchRes.body.data.forEach(scan => {
      expect(scan.category_name).toEqual('General');
    });
    console.log('Task 12: Delete category and fetch scans (reassigned to General): pass');
  });

});
