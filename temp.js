    // Message JSON to hold the message statement with error number
    // const message_json = {
    //     // Register Confirmation Message (Always click OK)
    //     "Do you want to bulk register students?" : [1,"Confirmation Message"],
    //     // student id existed
    //     "student information needs to be corrected for a total of 1 enrollments.  Do you want to proceed?" : [2,"Student ID Existed"],
    //     // student id empty
    //     "Please enter ID.":[3, "Student ID empty"],
    //     // student password empty
    //     "Please enter PW.":[4, "Student Password empty"],
    //     // student name empty
    //     "Please enter Name." : [5,"Student Name empty"],
    //     // Class code empty
    //     "Class code is mandatory to be filled." :[6, "Class Code empty"],
    //     // wrong class code
    //     "Class code is not a class belonging to the institution." : [7, "Wrong Class Code"],
    //     // Parent name empty
    //     "Please enter the parent’s names.": [8, "Parent Name empty"],
    //     // Parent code empty
    //     "Please enter parent classification.": [9, "Parent Code empty"],
    //     // Parent code with string format
    //     "Correction and batch registration failed.   Please contact your system representative.": [10, "Parent Code with wrong format"],
    //     // #Parent Passwod is empty
    //     "parentsPlease enter the password.":[11, "Parent Password empty"],
    //     // Create new student (Success meassage)
    //     "1 modifications and registrations have been completed." : [200, "Create New Student Successfully"]
    // };



    // //get alert message
                // let alert_msg = dialog.message();
                // let msg_num = message_json[alert_msg][0];
                // let message = message_json[alert_msg][1];
                // //Accept the first dialog
                // if(msg_num == 1){
                //     await sleep(2);
                //     //accept alert
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 2){
                //     await dialog.dismiss();
                //     await sleep(2);
                // }
                // else if (msg_num == 3){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 4){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 5){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 6){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 7){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 8){
                //     await sleep(2);
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 9){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 10){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 11){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else if (msg_num == 200){
                //     await dialog.accept();
                //     await sleep(2);
                // }
                // else{
                //     console.log('Special Message Found!!!!!');
                //     await sleep(2);
                // }       