document.addEventListener('DOMContentLoaded', () => {
    const SPREADSHEET_ID = '1EwK-Co9glsswvy9pQpWeLxq8QXGt5SUaQOYekQ4rTJE';
    const SHEET_NAME = 'TS7';
    const GOOGLE_SHEETS_API_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

    const loginSection = document.getElementById('login-section');
    const nisnInput = document.getElementById('nisn-input');
    const loginButton = document.getElementById('login-button');
    const resultSection = document.getElementById('result-section');
    const loadingMessage = document.getElementById('loading');

    const namaLengkapSpan = document.getElementById('nama-lengkap');
    const nisnSpan = document.getElementById('nisn');
    const kelasSpan = document.getElementById('kelas');
    const rankSpan = document.getElementById('rank');
    const nilaiSpan = document.getElementById('nilai');
    const answerTableBody = document.getElementById('answer-table-body');

    let sheetData = []; // To store the parsed sheet data
    let answerKey = []; // To store the answer key

    // Function to fetch data from Google Sheets
    async function fetchSheetData() {
        loadingMessage.classList.remove('hidden');
        try {
            const response = await fetch(GOOGLE_SHEETS_API_URL);
            const text = await response.text();
            // Google Sheets API returns a JSONP-like response, need to parse it
            const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonText);

            sheetData = data.table.rows;

            // Extract header from row 2 (index 1)
            const headerRow = sheetData[1].c;
            const headers = headerRow.map(cell => cell && cell.v ? cell.v : '');

            // Find the start and end column for the answer key (F to AD)
            const answerKeyStartCol = headers.indexOf('F') !== -1 ? headers.indexOf('F') : 5; // Assuming E is 6th column, index 5
            const answerKeyEndCol = headers.indexOf('AD') !== -1 ? headers.indexOf('AD') : 30; // Assuming AR is 30th column, index 29

            // The answer key is in row 2 (index 1) in the specified columns
            answerKey = sheetData[1].c.slice(answerKeyStartCol, answerKeyEndCol + 1).map(cell => cell && cell.v ? cell.v : '');

            loadingMessage.classList.add('hidden');
            console.log("Data fetched successfully:", sheetData);
            console.log("Answer Key:", answerKey);

        } catch (error) {
            console.error('Error fetching data:', error);
            loadingMessage.textContent = 'Failed to load data. Please try again later.';
        }
    }

    // Function to display student data and answers
    function displayStudentData(studentRow) {
        // Assuming the columns for NAMA LENGKAP, NISN, KELAS, NILAI are fixed.
        // You might need to adjust these indices based on your actual sheet.
        // For example, if:
        // Column A = NAMA LENGKAP (index 0)
        // Column B = NISN (index 1)
        // Column C = KELAS (index 2)
        // Column D = RANK (index 3)
        // Column E = NILAI (index 4)
        // Adjust these indices as per your sheet's column order.
        const namaLengkap = studentRow.c[0] ? studentRow.c[0].v : 'N/A';
        const nisn = studentRow.c[1] ? studentRow.c[1].v : 'N/A';
        const kelas = studentRow.c[2] ? studentRow.c[2].v : 'N/A';
        const rank = studentRow.c[3] ? studentRow.c[3].v : 'N/A';
        const nilaiRaw = studentRow.c[4] ? studentRow.c[4].v : 0;
        const nilai = Math.round(nilaiRaw); // Round to the nearest whole number

        namaLengkapSpan.textContent = namaLengkap;
        nisnSpan.textContent = nisn;
        kelasSpan.textContent = kelas;
        rankSpan.textContent = rank;
        nilaiSpan.textContent = nilai;

        // Clear previous answers
        answerTableBody.innerHTML = '';

        // Assuming student's answers start from column F (index 5)
        // and go up to column AD (index 29), same as the answer key
        const studentAnswers = studentRow.c.slice(5, 30).map(cell => cell && cell.v ? cell.v : '');

        for (let i = 0; i < answerKey.length; i++) {
            const row = document.createElement('tr');
            const questionNumber = i + 1;
            const studentAnswer = studentAnswers[i];
            const correctAnswer = answerKey[i];
            const isCorrect = studentAnswer === correctAnswer;
            const status = isCorrect ? 'BENAR' : 'SALAH';

            if (!isCorrect) {
                row.classList.add('incorrect-row');
            }

            row.innerHTML = `
                <td>${questionNumber}</td>
                <td>${studentAnswer}</td>
                <td>${status}</td>
            `;
            answerTableBody.appendChild(row);
        }

        loginSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
    }

    // Login logic
    loginButton.addEventListener('click', () => {
        const enteredNisn = nisnInput.value.trim();

        if (!enteredNisn) {
            alert('Please enter your NISN.');
            return;
        }

        // Search for the NISN in the sheetData, starting from row 3 (index 2)
        const studentRow = sheetData.slice(2).find(row => {
            // Assuming NISN is in the second column (index 1)
            return row.c[1] && String(row.c[1].v) === enteredNisn;
        });

        if (studentRow) {
            displayStudentData(studentRow);
        } else {
            alert('NISN not found. Please check your NISN and try again.');
        }
    });

    // Initial data fetch when the page loads
    fetchSheetData();
});
