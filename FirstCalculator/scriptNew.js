const screen = document.getElementById("screen");
let screenValue = "0"; // inital value on the screen is empty
let Ans = Totsl = 0;
document.getElementById("calc-buttons").addEventListener("click", function(e) {
  const tgt = e.target;
  if (tgt.tagName !== "BUTTON") return;

  var buttonText = tgt.innerText; //  Gets the text of that button which is clicked 
    if (!isNaN(buttonText)){
        isNumber(buttonText);
    }else {
        switch (buttonText) {
            case 'C':
                screenValue = "0";
                screen.value = screenValue;
                break;
            case '←':
                screenValue = screenValue.slice(0,-1);
                screen.value = screenValue;
                break;
            case '=':
                screen.value = eval(screenValue);
                break;
            case '.':
                screenValue += '.';
                screen.value += '.';
                break;
            case 'Ans':
                if (screenValue == "0")
                    screenValue = Ans;
                else {
                    screenValue += Ans;
                }
                break;
            case '×':
            case '÷':
            case '+':
            case '-':
                isMathOperation(buttonText);
                break;
        
        }
    }


    isNumber(buttonText){
        if (screenValue == '0')
            screenValue = buttonText;
        else {
            screenValue +=buttonText;
        }
    }


    isMathOperation (buttonText){
        if (buttonText == '×'){
            total *= Float(buttonText);
        }
        e;

    }


})