const puppeteer = require('puppeteer');
const reader = require('xlsx');
const Excel = require('exceljs');
const date = require('date-and-time');
const fs = require('fs').promises;
const path = require('path');
async function getPage(){
    let browser_options = {
        headless: false,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ["--disable-extensions"],
        defaultViewport: { width: 1366, height: 1080 },
        args: [
          "--window-position=0,0",
          "--window-size=1366,1080",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-notifications",
          "--ignore-certificate-errors",
          "--ignore-certificate-errors-spki-list ",
          "--enable-sync",
        ],
        executablePath: 'google-chrome-stable'
      };
    const browser = await puppeteer.launch(browser_options);
    const page = await browser.newPage();
    return page;
}
async function loginAdmin(page) {
    let adminCredential = {
        username : "Alab",
        password: "AlabmAg2022"
    }
    //head to Mag login page
    await page.goto('https://mag.alab.edu.vn/',{ waitUntil: "networkidle2" });
    await sleep(2);
    // find ID field and send the username itself to the ID input field
    await page.type("#userId",adminCredential.username);
    await sleep(2);
    // find Password field and send the password itself to the password input field
    await page.type("#userPwd",adminCredential.password);
    await sleep(2);
    // click on sign-in button
    const login_button = await page.$x('//*[@id="btnLogin"]');
    login_button[0].click();
    await page.waitForNavigation();
    await sleep(3);
    // await browser.close();
}
async function check_student_dup(browser,page,student_info){
    var student_dup = [];
    var student_not_found = [];
    //head to Student Management Page
    page.goto('https://mag.alab.edu.vn/member/memberSearchList.do');
    await sleep(2);
    //Click on the Include Test Cenber box
    const include_test_center_button = await page.$x('//*[@id="eles-dash-main"]/div[3]/div[1]/div[2]/div[4]/label');
    await include_test_center_button[0].click();
    await sleep(2);
    //select the ID Field to search
    await page.select('select[id="inStudentType"]','002');
    await sleep(2);
    //Checking Student ID Duplication
    for(const student of student_info){
        let student_id = student['ems_id'];
        //Clear Student ID textbox
        await page.evaluate( () => document.getElementById("inStudentSearch").value = "");
        await sleep(1);
        //Enter student ID to the search box
        await page.type('#inStudentSearch',student_id);
        await sleep(2);
        //Click on search button
        search_button = await page.$x('//*[@id="eles-dash-main"]/div[3]/div[1]/div[2]/div[5]/button[@onclick="searchData();"]');
        await search_button[0].click();
        await sleep(2);
        //Checking valid student ID with row = 1 and column = 1
        let student_rows = await page.$x('//*[@id="eles-dash-main"]/div[3]/table/tbody/tr');
        let student_cols = await page.$x('//*[@id="eles-dash-main"]/div[3]/table/tbody/tr/td');
        if(student_rows.length == 1){
            if(student_cols.length == 1){
                console.log('Student ID not found');
                student_not_found.push(student);
            }
            else if (student_cols.length > 1){
                console.log('Student ID found with one result');
                student_dup.push(student);
            }
            else{
                console.log('Special case when student column = 1');
            }
        }
        else if(student_rows.length > 1) {
            console.log('Student ID found with more than one result');
            student_dup.push(student);
        }
        else{
            console.log('Special case when student row = 1');
        }
    }
    return {
        "student_dup" : student_dup,
        "student_not_found": student_not_found
    };
}

async function loginCenter(browser,page,login_code,center_code){
    //head to center info page
    await page.goto('https://mag.alab.edu.vn/branchfranchise/franchiseAccountList.do',{ waitUntil: "networkidle2" });
    await sleep(2);
    //select view to 100 views
    let itemPerPage = 100;
    let pageSelector = `select[id="recordCountPerPage"]`;
    await page.select(pageSelector, itemPerPage.toString());
    await sleep(2);
    //find the login button
    let login_button = (await page.$x(`//*[@id="eles-dash-main"]/div[3]/table/tbody/tr/td[11]/a[@onclick ="frLogin(\'${login_code}\')"]`)|| "")
    await sleep(2);
    //on event listener trigger
    await page.once('dialog', async dialog => {
        //get alert message
        // console.log(dialog.message());
        await sleep(2);
        //accept alert
        await dialog.accept();
    })
    await login_button[0].click();
    await sleep(2);
}
async function movingCenterLMS(browser, page,student_info){
    //ems_center_code : [value,login_code,lms_center_code]
    const center_mapper = {
        "QT" : ["1759","krEJcwgxb2nY5_0DNHmEeQ","QT"],
        "VALAB": ["1755","JOvs6TBc8wbJqBY1_z6lQQ","V-ALAB"],
        "PDL" : ["1754","L6pbhxGqfHfq0BBsSfy4tQ","PDL"],
        "KDV" : ["1753","gpl6yD6RxUKR02pUCzf_7g","KDV"],
        "HB" : ["1752","aOoeVoHC2ZJhq6LtXy0HVQ","HBC"],
        "CHG" : ["1751","EtOfGnY2FhzePPL63VzvvQ","CHC"],
        "LTK" : ["1750","picFaVF3cmwbeTOJI7QFMA","LTK"],
        "PVT" : ["1749","vceFOCTEvpUWhbZZS3l8sA","PVT"],
        "CSM" : ["1748","BQ_8-DgQA0SkZSbtQkNO-A","CSM"],
        "ALAB TEST" : ["1747","8Rm2Ute2MsRHyuvvzsnW3w","GL"]
    }
    var student_id = student_info['MaHV'];
    var center_out = center_mapper[student_info['CenterCurrent']][2];
    var center_in = center_mapper[student_info['CenterMoving']][2];
    var student_name = student_info.Name
    var message_list = {
        1 : 'Student ID found with more than one result',
        2 : 'Special case when student row = 1',
        3 : 'Student ID not found',
        4 : 'Special case when student column = 1',
        5 : "Student's Name in EMS is not matching Student's Name in LMS",
        6 : "Special case when current name is not matching",
        7 : "Student's Center is not matching with LMS's Center",
        8 : "Moving Failed!!!!!!",
        9 : "Special Case when double check current center and center in",
        10 : "Center is not found!!!!!",
        11 : "Moving successful!!!!!"
    }
    var msg_num = 0
    //head to Student Management Page
    page.goto('https://mag.alab.edu.vn/member/memberSearchList.do')
    await sleep(2);
    //select the ID Field to search
    await page.select('select[id="inStudentType"]','002');
    await sleep(2);
    //Enter student ID to the search box
    await page.type('#inStudentSearch',student_id);
    await sleep(5);
    //Click on search button
    search_button = await page.$x('//*[@id="eles-dash-main"]/div[3]/div[1]/div[2]/div[5]/button[@onclick="searchData();"]');
    await search_button[0].click();
    await sleep(2);
    //Checking valid student ID with row = 1 and column = 1
    student_rows = await page.$x('//*[@id="eles-dash-main"]/div[3]/table/tbody/tr');
    student_cols = await page.$x('//*[@id="eles-dash-main"]/div[3]/table/tbody/tr/td');
    if(student_rows.length == 1){
        if(student_cols.length == 1){
            console.log('Student ID not found');
            msg_num = 3;
        }
        else if (student_cols.length > 1){
            //Checking Student's Name
            current_name = await page.evaluate(()=>{
                return document.querySelector('#eles-dash-main > div.contents > table > tbody > tr:nth-child(1) > td:nth-child(4) > a').innerText;
            });
            if(current_name == student_name){
                //Checking Student's Center Out
                current_center = await page.evaluate(()=>{
                    return document.querySelector('#eles-dash-main > div.contents > table > tbody > tr:nth-child(1) > td:nth-child(3)').innerText;
                });
                if(current_center == center_out){
                    //Click on Application Button
                    application_button = await page.$x('//*[@id="eles-dash-main"]/div[3]/table/tbody/tr/td[9]/a');
                    await application_button[0].click();
                    await sleep(2);
                    //Find center radio button on the 1st page
                    let center_button = (await page.$(`input#changeFridx[value="${center_mapper[student_info['CenterMoving']][0]}"]`)) || "";
                    if (center_button != ""){
                        console.log('Center is found on the 1st page');
                        //Click on center radio button
                        await center_button.click();
                        await sleep(2);
                        //Click on 1st & 2nd popup
                        //on event listener trigger
                        await page.on('dialog', async dialog => {
                            //get alert message
                            console.log(dialog.message());
                            await sleep(2);
                            //accept alert
                            await dialog.accept();
                        })
                        //Click on save button
                        let save_button = await page.$(`#choiceClass > div.modal-footer > button`);
                        await save_button.click();
                        await sleep(1);
                        //Click on search button to refresh page
                        search_button = await page.$x('//*[@id="eles-dash-main"]/div[3]/div[1]/div[2]/div[5]/button[@onclick="searchData();"]');
                        await search_button[0].click();
                        await sleep(2);
                        //Double-check the center after moving process
                        current_center = await page.evaluate(()=>{
                            return document.querySelector('#eles-dash-main > div.contents > table > tbody > tr:nth-child(1) > td:nth-child(3)').innerText;
                        });
                        if(current_center == center_in){
                            console.log(`Moving successful!!!!!`);
                            //Take the screenshot of student info after moving successful
                            let student_element = await page.$x(`//*[@id="eles-dash-main"]/div[3]/table/tbody/tr`)
                            screen_shot = await student_element[0].screenshot();
                            //Convert screen shot to byte array
                            screen_shot_base64 = await screen_shot.toString('base64');
                            msg_num = 11;
                        }
                        else if(current_center != center_in){
                            console.log(`Moving Failed!!!!!!`);
                            msg_num = 8;
                        }
                        else{
                            console.log(`Special Case when double check current center and center in`);
                            msg_num = 9;
                        }
                    }
                    else{
                        console.log('Center is not found on the 1st page');
                        console.log('Go to the next page');
                        //Click on the next page
                        let next_page_button = await page.$x(`//*[@id="choiceClass"]/div[1]/div/div/nav/ul/li[4]/a[contains(@onclick,"onPopChangePage(2); return false;")]`);
                        await next_page_button[0].click();
                        await sleep(2)
                        //Find the center radio button on the 2nd page
                        center_button = (await page.$(`input#changeFridx[value="${center_mapper[student_info['CenterMoving']][0]}"]`)) || "";
                        if (center_button != ""){
                            console.log('Center is found on the 2nd page');
                            //Click on center radio button
                            await center_button.click();
                            await sleep(2);
                            //Click on 1st & 2nd popup
                            //on event listener trigger
                            await page.on('dialog', async dialog => {
                                //get alert message
                                console.log(dialog.message());
                                await sleep(2);
                                //accept alert
                                await dialog.accept();
                            })
                            //Click on save button
                            let save_button = await page.$(`#choiceClass > div.modal-footer > button`);
                            await save_button.click();
                            await sleep(2);
                            //Click on search button to refresh page
                            search_button = await page.$x('//*[@id="eles-dash-main"]/div[3]/div[1]/div[2]/div[5]/button[@onclick="searchData();"]');
                            await search_button[0].click();
                            await sleep(5);
                            //Double-check the center after moving process
                            current_center = await page.evaluate(()=>{
                                return document.querySelector('#eles-dash-main > div.contents > table > tbody > tr:nth-child(1) > td:nth-child(3)').innerText;
                            });
                            if(current_center == center_in){
                                console.log(`Moving successful!!!!!`);
                                //Take the screenshot of student info after moving successful
                                let student_element = await page.$x(`//*[@id="eles-dash-main"]/div[3]/table/tbody/tr`)
                                screen_shot = await student_element[0].screenshot()
                                //Convert screen shot to byte array
                                screen_shot_base64 = await screen_shot.toString('base64');
                                msg_num = 11;
                            }
                            else if(current_center != center_in){
                                console.log(`Moving Failed!!!!!!`);
                                msg_num = 8;
                            }
                            else{
                                console.log(`Special Case when double check current center and center in`);
                                msg_num = 9;
                            }
                        }
                        else{
                            console.log('Center is not found!!!!!');
                            msg_num = 10;
                        }
                    }
                }
                else if (current_center != center_out){
                    console.log(`Student's Center is not matching with LMS's Center`);
                    msg_num = 7;
                }
                else {
                    print('Special Case when two centers are not matching.')
                }
            }
            else if(current_name != student_name){
                console.log(`Student's Name in EMS is not matching Student's Name in LMS`);
                msg_num = 5;
            }
            else{
                console.log(`Special case when current name is not matching`)
                msg_num = 6;
            }
        }
        else{
            console.log('Special case when student column = 1');
            msg_num = 4;
        }
    }
    else if(student_rows.length > 1) {
        console.log('Student ID found with more than one result');
        msg_num = 1;
    }
    else{
        console.log('Special case when student row = 1');
        msg_num = 2;
    }
    await browser.close();
    return{
        "MaHV" : student_id,
        "Name" : student_name,
        "CenterCurrent" : student_info['CenterCurrent'],
        "CenterMoving": student_info['CenterMoving'],
        "Screenshot": screen_shot_base64,
        "Message" : message_list[msg_num],
        "Message No." : msg_num
    }
}
async function createStudent(browser,page,student_info){
    //ems_center_code : [value,login_code,lms_center_code,class_code(keep-in-active class)]
    const center_mapper = {
        "QT" : ["1759","krEJcwgxb2nY5_0DNHmEeQ","QT","3182"],
        "VALAB": ["1755","JOvs6TBc8wbJqBY1_z6lQQ","V-ALAB","2029"],
        "PDL" : ["1754","L6pbhxGqfHfq0BBsSfy4tQ","PDL","2863"],
        "KDV" : ["1753","gpl6yD6RxUKR02pUCzf_7g","KDV","3181"],
        "HB" : ["1752","aOoeVoHC2ZJhq6LtXy0HVQ","HBC","1975"],
        "CHG" : ["1751","EtOfGnY2FhzePPL63VzvvQ","CHC","1973"],
        "LTK" : ["1750","picFaVF3cmwbeTOJI7QFMA","LTK"],
        "PVT" : ["1749","vceFOCTEvpUWhbZZS3l8sA","PVT","1977"],
        "CSM" : ["1748","BQ_8-DgQA0SkZSbtQkNO-A","CSM","1974"],
        "ALAB TEST" : ["1747","8Rm2Ute2MsRHyuvvzsnW3w","ALAB TEST","3119"]
    };
    var students_by_center = {
        "QT": [],
        "VALAB": [],
        "PDL": [],
        "KDV": [],
        "HB": [],
        "CHG": [],
        "LTK": [],
        "PVT": [],
        "CSM": [],
        "ALAB TEST" : []
    };
    //Checking duplicated students
    let student_check_list = await check_student_dup(browser,page,student_info);
    let student_valid = student_check_list.student_not_found;
    let student_dup = student_check_list.student_dup;
    //Filter valid students by Center
    for (const student of student_valid){
        if(student['center_code'] == "QT"){
            students_by_center["QT"].push(student);
        }
        else if(student['center_code'] == "VALAB"){
            students_by_center["VALAB"].push(student);
        }
        else if(student['center_code'] == "PDL"){
            students_by_center["PDL"].push(student);
        }
        else if(student['center_code'] == "KDV"){
            students_by_center["KDV"].push(student);
        }
        else if(student['center_code'] == "HB"){
            students_by_center["HB"].push(student);
        }
        else if(student['center_code'] == "CHG"){
            students_by_center["CHG"].push(student);
        }
        else if(student['center_code'] == "LTK"){
            students_by_center["LTK"].push(student);
        }
        else if(student['center_code'] == "PVT"){
            students_by_center["PVT"].push(student);
        }
        else if(student['center_code'] == "CSM"){
            students_by_center["CSM"].push(student);
        }
        else if(student['center_code'] == "ALAB TEST"){
            // students_ALAB_TEST.push(student);
            students_by_center["ALAB TEST"].push(student);
        }
    };
    //Start Create Student Process 
    for (let center in students_by_center){
        if(students_by_center[center].length == 0){
            continue;
        }
        else{
            var center_code_visang = center_mapper[center][2];
            var login_code = center_mapper[center][1];
            var student_list = students_by_center[center];
            var class_code = center_mapper[center][3];
            await loginCenter(browser,page,login_code,center_code_visang);
            await sleep(2);
            //Switch to Center Page after login successfully
            var pages = await browser.pages();
            console.log(pages.length);
            let center_page = pages[pages.length - 1];
            // Head to Student List
            await center_page.goto('https://join.alab.edu.vn/member/memberList.do');
            await sleep(2);
            // Click on Batch Registration button
            batch_reg_button = await center_page.$x('//*[@id="batchRegBtn"]');
            await batch_reg_button[0].click();
            await sleep(2);
            //update new pages and switch to popup batch registration window
            pages = await browser.pages();
            let popup_window = pages[pages.length - 1];
            // NOW WE ARE ON POPUP WINDOW
            // Fill Batch Template and return its file name
            let file_name_template = await fill_template(student_list,class_code);
            // Upload Batch file to LMS
            await popup_window.waitForSelector('input[type=file]');
            const inputUploadHandle = await popup_window.$('input[type=file]');
            await sleep(2);
            inputUploadHandle.uploadFile(path.join(__dirname,'..',file_name_template));
            console.log(path.join(__dirname,'..',file_name_template));
            //Handling 2 alert messages after clicking the register button
            //on event listener trigger
            await popup_window.on('dialog', async dialog => {
                await sleep(2);
                console.log(dialog.message());
                await dialog.accept();
            });
            //Click to Register button
            await popup_window.waitForSelector('button[id=batchRegistBtn]');
            let register_button = await popup_window.$('button[id=batchRegistBtn]');
            await register_button.click();
            await sleep(2);
            //Delete template
            await fs.unlink(`./${file_name_template}`, (error)=>{
                if (error){
                    throw error;
                }
                else {
                    console.log('The file was deleted!!!!!');
                }
            });
        }
    }
    await browser.close();
    return {
        "created_student" : student_valid,
        "duplicated_student" : student_dup
    }
}
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms*1000);
    });
}
async function fill_template(student_list,class_code) {
    const now = new Date();
    let date_string = date.format(now,'YYYY-MM-DD_HH-mm-ss');
    let file_name = `member_template_filled_${date_string}.xls`;
    console.log(student_list);
    var wb = reader.utils.book_new();      
    wb.SheetNames.push("Sheet1");
    var ws_data = [];
    for(let i = 0; i<student_list.length;i++){
        ws_data.push(
            {
                'No': i+1,
                'ID': student_list[i]['ems_id'],
                'PW': 'alab123456',
                'Name': student_list[i]['student_name'],
                'BirthDate': '19900101',
                'Privacy agree status':'Y',
                'Class code':class_code,
                'parent name':'Parent',
                'parent code':'003',
                'parent password':'q12345'
            }
        );
    }
    console.log(ws_data);
    var ws = reader.utils.json_to_sheet(ws_data);
    // var ws_data = [{'No':"1" , 'ID':ems_id,'PW':'alab123456','Name':student_name,'BirthDate':student_dob,'Privacy agree status':'Y','Class code':class_code,'parent name':parent_name,'parent code':'003','parent password':'q12345'}];
    wb.Sheets["Sheet1"] = ws;
    reader.writeFile(wb,file_name);
    return file_name;
}
//Moving Center Jobs
exports.MovingCenterLMS = async (student_info) => {
    let browser_options = {
        headless: true,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ["--disable-extensions"],
        // defaultViewport: { width: 1366, height: 1080 },
        args: [
          "--window-position=0,0",
          "--window-size=1366,1080",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-notifications",
          "--ignore-certificate-errors",
          "--ignore-certificate-errors-spki-list ",
          "--enable-sync",
        ]
      };
    const browser = await puppeteer.launch(browser_options);
    // Close the new tab that chromium always opens first.
    const pages = await browser.pages();
    pages[0].close();
    // Create a new page (tab) in the browser
    const page = await browser.newPage();
    await loginAdmin(page);
    // await loginCenter(browser,page,'vceFOCTEvpUWhbZZS3l8sA','PVT');
    // await loginCenter(browser,page,'krEJcwgxb2nY5_0DNHmEeQ','QT');
    moved_student = await movingCenterLMS(browser,page,student_info);
    return moved_student;
};


//Create Student
exports.CreateStudent = async (student_info) => {
    let browser_options = {
        headless: true,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ["--disable-extensions"],
        // defaultViewport: { width: 1366, height: 1080 },
        args: [
          "--window-position=0,0",
          "--window-size=1366,1080",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-notifications",
          "--ignore-certificate-errors",
          "--ignore-certificate-errors-spki-list ",
          "--enable-sync",
        ]
      };
    const browser = await puppeteer.launch(browser_options);
    // Close the new tab that chromium always opens first.
    const pages = await browser.pages();
    pages[0].close();
    // Create a new page (tab) in the browser
    const page = await browser.newPage();
    await loginAdmin(page); 
    await sleep(2);
    var response = await createStudent(browser,page,student_info);
    return response;
}


