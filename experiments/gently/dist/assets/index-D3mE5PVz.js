(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function t(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=t(r);fetch(r.href,a)}})();var n=(s=>(s.SET="SET",s.TO="TO",s.IF="IF",s.THEN="THEN",s.ELSE="ELSE",s.END="END",s.FUNCTION="FUNCTION",s.TAKING="TAKING",s.WITH="WITH",s.REPEAT="REPEAT",s.TIMES="TIMES",s.WHILE="WHILE",s.FOR="FOR",s.EACH="EACH",s.IN="IN",s.DO="DO",s.RETURN="RETURN",s.AND="AND",s.OR="OR",s.NOT="NOT",s.IS="IS",s.EQUAL="EQUAL",s.GREATER="GREATER",s.LESS="LESS",s.THAN="THAN",s.PLUS="PLUS",s.MINUS="MINUS",s.TIMES_OP="TIMES_OP",s.DIVIDED="DIVIDED",s.BY="BY",s.MOD="MOD",s.JOINED="JOINED",s.LIST="LIST",s.OF="OF",s.ITEM="ITEM",s.YES="YES",s.NO="NO",s.PRINT="PRINT",s.DRAW="DRAW",s.CIRCLE="CIRCLE",s.RECTANGLE="RECTANGLE",s.LINE="LINE",s.AT="AT",s.FROM="FROM",s.RADIUS="RADIUS",s.WIDTH="WIDTH",s.HEIGHT="HEIGHT",s.COLOR="COLOR",s.CLEAR="CLEAR",s.CANVAS="CANVAS",s.NUMBER="NUMBER",s.STRING="STRING",s.IDENTIFIER="IDENTIFIER",s.LENGTH="LENGTH",s.ASK="ASK",s.STORE="STORE",s.RANDOM="RANDOM",s.NUMBER_KW="NUMBER_KW",s.COMMA="COMMA",s.PLUS_SYMBOL="PLUS_SYMBOL",s.MINUS_SYMBOL="MINUS_SYMBOL",s.STAR="STAR",s.SLASH="SLASH",s.LEFT_PAREN="LEFT_PAREN",s.RIGHT_PAREN="RIGHT_PAREN",s.NEWLINE="NEWLINE",s.EOF="EOF",s))(n||{});class g extends Error{constructor(e,t,i,r){super(e),this.name="ClearError",this.line=t,this.column=i,this.hint=r}format(e){let t=`Error on line ${this.line}: ${this.message}`;if(e){const r=e.split(`
`)[this.line-1];r&&(t+=`

`,t+=`  ${this.line} | ${r}
`,t+=`  ${" ".repeat(String(this.line).length)} | ${" ".repeat(this.column-1)}^`)}return this.hint&&(t+=`

Hint: ${this.hint}`),t}}class m extends g{constructor(e,t,i,r){super(e,t,i,r),this.name="ParseError"}}class h extends g{constructor(e,t,i=1,r){super(e,t,i,r),this.name="RuntimeError"}}function O(s,e){const t=s.toLowerCase(),i=e.filter(c=>c.startsWith(t));if(i.length===1)return i[0];let r=null,a=1/0;for(const c of e){const o=F(t,c.toLowerCase());o<a&&o<=2&&(a=o,r=c)}return r}function F(s,e){const t=[];for(let i=0;i<=e.length;i++)t[i]=[i];for(let i=0;i<=s.length;i++)t[0][i]=i;for(let i=1;i<=e.length;i++)for(let r=1;r<=s.length;r++)e[i-1]===s[r-1]?t[i][r]=t[i-1][r-1]:t[i][r]=Math.min(t[i-1][r-1]+1,t[i][r-1]+1,t[i-1][r]+1);return t[e.length][s.length]}const T={set:n.SET,to:n.TO,if:n.IF,then:n.THEN,else:n.ELSE,end:n.END,function:n.FUNCTION,taking:n.TAKING,with:n.WITH,repeat:n.REPEAT,times:n.TIMES,while:n.WHILE,for:n.FOR,each:n.EACH,in:n.IN,do:n.DO,return:n.RETURN,and:n.AND,or:n.OR,not:n.NOT,is:n.IS,equal:n.EQUAL,greater:n.GREATER,less:n.LESS,than:n.THAN,plus:n.PLUS,minus:n.MINUS,divided:n.DIVIDED,by:n.BY,mod:n.MOD,joined:n.JOINED,list:n.LIST,of:n.OF,item:n.ITEM,yes:n.YES,no:n.NO,print:n.PRINT,draw:n.DRAW,circle:n.CIRCLE,rectangle:n.RECTANGLE,line:n.LINE,at:n.AT,from:n.FROM,radius:n.RADIUS,width:n.WIDTH,height:n.HEIGHT,color:n.COLOR,clear:n.CLEAR,canvas:n.CANVAS,length:n.LENGTH,ask:n.ASK,store:n.STORE,random:n.RANDOM,number:n.NUMBER_KW};class M{constructor(e){this.tokens=[],this.start=0,this.current=0,this.line=1,this.column=1,this.lineStart=0,this.source=e}tokenize(){for(;!this.isAtEnd();)this.start=this.current,this.scanToken();return this.tokens.push({type:n.EOF,value:"",line:this.line,column:this.column}),this.tokens}scanToken(){const e=this.advance();switch(e){case" ":case"\r":case"	":break;case`
`:this.addToken(n.NEWLINE,"\\n"),this.line++,this.lineStart=this.current,this.column=1;break;case",":this.addToken(n.COMMA,",");break;case"+":this.addToken(n.PLUS_SYMBOL,"+");break;case"-":this.addToken(n.MINUS_SYMBOL,"-");break;case"*":this.addToken(n.STAR,"*");break;case"/":this.addToken(n.SLASH,"/");break;case"(":this.addToken(n.LEFT_PAREN,"(");break;case")":this.addToken(n.RIGHT_PAREN,")");break;case'"':this.string();break;default:if(this.isDigit(e))this.number();else if(this.isAlpha(e))this.identifier();else throw new g(`I don't recognize the character '${e}'`,this.line,this.column-1)}}string(){const e=this.line,t=this.column-1;for(;this.peek()!=='"'&&!this.isAtEnd();)this.peek()===`
`&&(this.line++,this.column=1),this.advance();if(this.isAtEnd())throw new g('I found a string that was never closed. Add a " at the end.',e,t);this.advance();const i=this.source.slice(this.start+1,this.current-1);this.addToken(n.STRING,i)}number(){for(;this.isDigit(this.peek());)this.advance();if(this.peek()==="."&&this.isDigit(this.peekNext()))for(this.advance();this.isDigit(this.peek());)this.advance();const e=this.source.slice(this.start,this.current);this.addToken(n.NUMBER,e)}identifier(){for(;this.isAlphaNumeric(this.peek());)this.advance();const e=this.source.slice(this.start,this.current).toLowerCase();if(e==="note"&&this.peek()===":"){for(this.advance();this.peek()!==`
`&&!this.isAtEnd();)this.advance();return}const t=T[e]??n.IDENTIFIER;this.addToken(t,e)}isAtEnd(){return this.current>=this.source.length}advance(){return this.column++,this.source[this.current++]}peek(){return this.isAtEnd()?"\0":this.source[this.current]}peekNext(){return this.current+1>=this.source.length?"\0":this.source[this.current+1]}isDigit(e){return e>="0"&&e<="9"}isAlpha(e){return e>="a"&&e<="z"||e>="A"&&e<="Z"||e==="_"}isAlphaNumeric(e){return this.isAlpha(e)||this.isDigit(e)}addToken(e,t){this.tokens.push({type:e,value:t,line:this.line,column:this.column-t.length})}}function B(s){return new M(s).tokenize()}class ${constructor(e){this.current=0,this.tokens=e.filter(t=>t.type!==n.NEWLINE)}parse(){const e=[];for(;!this.isAtEnd();){const t=this.parseStatement();t&&e.push(t)}return{type:"Program",statements:e}}parseStatement(){for(;this.check(n.NEWLINE);)this.advance();if(this.isAtEnd())return null;if(this.check(n.SET))return this.parseSetStatement();if(this.check(n.IF))return this.parseIfStatement();if(this.check(n.REPEAT))return this.parseRepeatStatement();if(this.check(n.FOR))return this.parseForEachStatement();if(this.check(n.FUNCTION))return this.parseFunctionDeclaration();if(this.check(n.RETURN))return this.parseReturnStatement();if(this.check(n.PRINT))return this.parsePrintStatement();if(this.check(n.DRAW))return this.parseDrawStatement();if(this.check(n.CLEAR))return this.parseClearCanvasStatement();if(this.check(n.ASK))return this.parseAskStatement();if(this.check(n.IDENTIFIER)){const t=this.peekNext();return t&&t.type===n.WITH?this.parseFunctionCallStatement():this.parseFunctionCallStatement()}const e=this.peek();throw new m(`I don't know how to handle '${e.value}' here`,e.line,e.column,"Statements usually start with: set, if, repeat, for, function, print, or draw")}parseSetStatement(){const e=this.consume(n.SET,"Expected 'set'");if(this.check(n.COLOR))return this.advance(),this.consume(n.TO,"Expected 'to' after 'set color'"),{type:"SetColorStatement",color:this.parseExpression(),line:e.line};if(this.check(n.ITEM)){this.advance();const r=this.parseSimpleExpression();this.consume(n.OF,"Expected 'of' after item index");const a=this.consume(n.IDENTIFIER,"Expected list name after 'of'");this.consume(n.TO,"Expected 'to' after list name");const c=this.parseExpression();return{type:"SetItemStatement",index:r,list:a.value,value:c,line:e.line}}const t=this.consume(n.IDENTIFIER,"Expected a variable name after 'set'");this.consume(n.TO,`Expected 'to' after 'set ${t.value}'`);const i=this.parseExpression();return{type:"SetStatement",identifier:t.value,value:i,line:e.line}}parseIfStatement(){const e=this.consume(n.IF,"Expected 'if'"),t=this.parseExpression();this.consume(n.THEN,"Expected 'then' after the condition");const i=[];for(;!this.check(n.END)&&!this.check(n.ELSE)&&!this.isAtEnd();){const a=this.parseStatement();a&&i.push(a)}let r=null;if(this.check(n.ELSE)){if(this.advance(),this.check(n.IF))return r=[this.parseIfStatement()],{type:"IfStatement",condition:t,thenBranch:i,elseBranch:r,line:e.line};for(r=[];!this.check(n.END)&&!this.isAtEnd();){const a=this.parseStatement();a&&r.push(a)}}return this.consume(n.END,"Expected 'end' to close the if statement"),this.consume(n.IF,"Expected 'if' after 'end' (write 'end if')"),{type:"IfStatement",condition:t,thenBranch:i,elseBranch:r,line:e.line}}parseRepeatStatement(){const e=this.consume(n.REPEAT,"Expected 'repeat'");if(this.check(n.WHILE)){this.advance();const r=this.parseExpression(),a=[];for(;!this.check(n.END)&&!this.isAtEnd();){const c=this.parseStatement();c&&a.push(c)}return this.consume(n.END,"Expected 'end' to close the repeat loop"),this.consume(n.REPEAT,"Expected 'repeat' after 'end' (write 'end repeat')"),{type:"RepeatWhileStatement",condition:r,body:a,line:e.line}}const t=this.parseValueExpression();this.consume(n.TIMES,"Expected 'times' after the number");const i=[];for(;!this.check(n.END)&&!this.isAtEnd();){const r=this.parseStatement();r&&i.push(r)}return this.consume(n.END,"Expected 'end' to close the repeat loop"),this.consume(n.REPEAT,"Expected 'repeat' after 'end' (write 'end repeat')"),{type:"RepeatTimesStatement",count:t,body:i,line:e.line}}parseForEachStatement(){const e=this.consume(n.FOR,"Expected 'for'");this.consume(n.EACH,"Expected 'each' after 'for'");const t=this.consume(n.IDENTIFIER,"Expected a variable name after 'for each'");this.consume(n.IN,`Expected 'in' after 'for each ${t.value}'`);const i=this.parseExpression();this.consume(n.DO,"Expected 'do' before the loop body");const r=[];for(;!this.check(n.END)&&!this.isAtEnd();){const a=this.parseStatement();a&&r.push(a)}return this.consume(n.END,"Expected 'end' to close the for loop"),this.consume(n.FOR,"Expected 'for' after 'end' (write 'end for')"),{type:"ForEachStatement",variable:t.value,iterable:i,body:r,line:e.line}}parseFunctionDeclaration(){const e=this.consume(n.FUNCTION,"Expected 'function'"),t=this.consume(n.IDENTIFIER,"Expected a function name after 'function'"),i=[];if(this.check(n.TAKING))for(this.advance();this.check(n.IDENTIFIER);)i.push(this.advance().value),this.check(n.COMMA)&&this.advance(),this.check(n.AND)&&this.advance();const r=[];for(;!this.check(n.END)&&!this.isAtEnd();){const a=this.parseStatement();a&&r.push(a)}return this.consume(n.END,"Expected 'end' to close the function"),this.consume(n.FUNCTION,"Expected 'function' after 'end' (write 'end function')"),{type:"FunctionDeclaration",name:t.value,parameters:i,body:r,line:e.line}}parseFunctionCallStatement(){const e=this.parseFunctionCallExpression();return{type:"FunctionCallStatement",call:e,line:e.arguments.length>0?this.previous().line:this.peek().line}}parseFunctionCallExpression(){const e=this.consume(n.IDENTIFIER,"Expected function name"),t=[];if(this.check(n.WITH))for(this.advance(),t.push(this.parseSimpleExpression());this.check(n.COMMA)||this.check(n.AND);)this.advance(),t.push(this.parseSimpleExpression());return{type:"FunctionCallExpression",name:e.value,arguments:t}}parseReturnStatement(){const e=this.consume(n.RETURN,"Expected 'return'");let t=null;return!this.checkStatementStart()&&!this.check(n.END)&&(t=this.parseExpression()),{type:"ReturnStatement",value:t,line:e.line}}parsePrintStatement(){const e=this.consume(n.PRINT,"Expected 'print'");return{type:"PrintStatement",value:this.parseExpression(),line:e.line}}parseDrawStatement(){const e=this.consume(n.DRAW,"Expected 'draw'"),t={};if(this.check(n.CIRCLE))return this.advance(),this.consume(n.AT,"Expected 'at' after 'draw circle'"),t.x=this.parseBasicValue(),this.consumeOptionalComma(),t.y=this.parseBasicValue(),this.consume(n.WITH,"Expected 'with' before radius"),this.consume(n.RADIUS,"Expected 'radius'"),t.radius=this.parseBasicValue(),{type:"DrawStatement",shape:"circle",params:t,line:e.line};if(this.check(n.RECTANGLE))return this.advance(),this.consume(n.AT,"Expected 'at' after 'draw rectangle'"),t.x=this.parseBasicValue(),this.consumeOptionalComma(),t.y=this.parseBasicValue(),this.consume(n.WITH,"Expected 'with' before dimensions"),this.consume(n.WIDTH,"Expected 'width'"),t.width=this.parseBasicValue(),this.check(n.AND)&&this.advance(),this.consume(n.HEIGHT,"Expected 'height'"),t.height=this.parseBasicValue(),{type:"DrawStatement",shape:"rectangle",params:t,line:e.line};if(this.check(n.LINE))return this.advance(),this.consume(n.FROM,"Expected 'from' after 'draw line'"),t.x1=this.parseBasicValue(),this.consumeOptionalComma(),t.y1=this.parseBasicValue(),this.consume(n.TO,"Expected 'to' in 'draw line from x1, y1 to x2, y2'"),t.x2=this.parseBasicValue(),this.consumeOptionalComma(),t.y2=this.parseBasicValue(),{type:"DrawStatement",shape:"line",params:t,line:e.line};throw new m("Expected 'circle', 'rectangle', or 'line' after 'draw'",e.line,e.column)}parseClearCanvasStatement(){const e=this.consume(n.CLEAR,"Expected 'clear'");return this.consume(n.CANVAS,"Expected 'canvas' after 'clear'"),{type:"ClearCanvasStatement",line:e.line}}parseAskStatement(){const e=this.consume(n.ASK,"Expected 'ask'"),t=this.parseExpression();this.consume(n.AND,"Expected 'and' after the prompt"),this.consume(n.STORE,"Expected 'store' after 'and'"),this.consume(n.IN,"Expected 'in' after 'store'");const i=this.consume(n.IDENTIFIER,"Expected variable name after 'in'");return{type:"AskStatement",prompt:t,variable:i.value,line:e.line}}parseExpression(){return this.parseOr()}parseSimpleExpression(){return this.parseComparison()}parseValueExpression(){return this.parsePrimary()}parseBasicValue(){return this.parseAdditiveNoFunctionCall()}parseAdditiveNoFunctionCall(){let e=this.parseMultiplicativeNoFunctionCall();for(;;){let t=null;if(this.check(n.PLUS)||this.check(n.PLUS_SYMBOL)?(this.advance(),t="plus"):(this.check(n.MINUS)||this.check(n.MINUS_SYMBOL))&&(this.advance(),t="minus"),t){const i=this.parseMultiplicativeNoFunctionCall();e={type:"BinaryExpression",operator:t,left:e,right:i}}else break}return e}parseMultiplicativeNoFunctionCall(){let e=this.parsePrimaryNoFunctionCall();for(;;){let t=null;if(this.check(n.TIMES_OP)||this.check(n.STAR)||this.check(n.TIMES)?(this.advance(),t="times"):this.check(n.DIVIDED)?(this.advance(),this.consume(n.BY,"Expected 'by' after 'divided'"),t="divided by"):this.check(n.SLASH)?(this.advance(),t="divided by"):this.check(n.MOD)&&(this.advance(),t="mod"),t){const i=this.parsePrimaryNoFunctionCall();e={type:"BinaryExpression",operator:t,left:e,right:i}}else break}return e}parsePrimaryNoFunctionCall(){if(this.check(n.NUMBER)){const e=this.advance();return{type:"NumberLiteral",value:parseFloat(e.value)}}if(this.check(n.IDENTIFIER))return{type:"Identifier",name:this.advance().value};if(this.check(n.MINUS_SYMBOL))return this.advance(),{type:"UnaryExpression",operator:"minus",operand:this.parsePrimaryNoFunctionCall()};throw new m("Expected a number or variable here",this.peek().line,this.peek().column)}parseOr(){let e=this.parseAnd();for(;this.check(n.OR);){this.advance();const t=this.parseAnd();e={type:"BinaryExpression",operator:"or",left:e,right:t}}return e}parseAnd(){let e=this.parseComparison();for(;this.check(n.AND);){this.advance();const t=this.parseComparison();e={type:"BinaryExpression",operator:"and",left:e,right:t}}return e}parseComparison(){let e=this.parseJoined();if(this.check(n.IS)){this.advance();let t;if(this.check(n.EQUAL))this.advance(),this.consume(n.TO,"Expected 'to' after 'is equal'"),t="equal to";else if(this.check(n.GREATER))this.advance(),this.consume(n.THAN,"Expected 'than' after 'is greater'"),this.check(n.OR)?(this.advance(),this.consume(n.EQUAL,"Expected 'equal' after 'or'"),this.consume(n.TO,"Expected 'to' after 'equal'"),t="greater than or equal to"):t="greater than";else if(this.check(n.LESS))this.advance(),this.consume(n.THAN,"Expected 'than' after 'is less'"),this.check(n.OR)?(this.advance(),this.consume(n.EQUAL,"Expected 'equal' after 'or'"),this.consume(n.TO,"Expected 'to' after 'equal'"),t="less than or equal to"):t="less than";else if(this.check(n.NOT))this.advance(),this.consume(n.EQUAL,"Expected 'equal' after 'is not'"),this.consume(n.TO,"Expected 'to' after 'equal'"),t="not equal to";else{if(this.check(n.YES))return{type:"ComparisonExpression",operator:"equal to",left:e,right:{type:"BooleanLiteral",value:!0}};if(this.check(n.NO))return{type:"ComparisonExpression",operator:"equal to",left:e,right:{type:"BooleanLiteral",value:!1}};throw new m("Expected 'equal to', 'greater than', 'less than', or 'not equal to' after 'is'",this.peek().line,this.peek().column)}const i=this.parseJoined();return{type:"ComparisonExpression",operator:t,left:e,right:i}}return e}parseJoined(){let e=this.parseAdditive();for(;this.check(n.JOINED);){this.advance(),this.consume(n.WITH,"Expected 'with' after 'joined'");const t=this.parseAdditive();e={type:"JoinedExpression",left:e,right:t}}return e}parseAdditive(){let e=this.parseMultiplicative();for(;;){let t=null;if(this.check(n.PLUS)||this.check(n.PLUS_SYMBOL)?(this.advance(),t="plus"):(this.check(n.MINUS)||this.check(n.MINUS_SYMBOL))&&(this.advance(),t="minus"),t){const i=this.parseMultiplicative();e={type:"BinaryExpression",operator:t,left:e,right:i}}else break}return e}parseMultiplicative(){let e=this.parseUnary();for(;;){let t=null;if(this.check(n.TIMES_OP)||this.check(n.STAR)?(this.advance(),t="times"):this.check(n.TIMES)?(this.advance(),t="times"):this.check(n.DIVIDED)?(this.advance(),this.consume(n.BY,"Expected 'by' after 'divided'"),t="divided by"):this.check(n.SLASH)?(this.advance(),t="divided by"):this.check(n.MOD)&&(this.advance(),t="mod"),t){const i=this.parseUnary();e={type:"BinaryExpression",operator:t,left:e,right:i}}else break}return e}parseUnary(){return this.check(n.NOT)?(this.advance(),{type:"UnaryExpression",operator:"not",operand:this.parseUnary()}):this.check(n.MINUS_SYMBOL)?(this.advance(),{type:"UnaryExpression",operator:"minus",operand:this.parseUnary()}):this.parsePrimary()}parsePrimary(){if(this.check(n.LEFT_PAREN)){this.advance();const t=this.parseExpression();return this.consume(n.RIGHT_PAREN,"Expected ')' after expression"),{type:"GroupedExpression",expression:t}}if(this.check(n.NUMBER)){const t=this.advance();return{type:"NumberLiteral",value:parseFloat(t.value)}}if(this.check(n.STRING))return{type:"StringLiteral",value:this.advance().value};if(this.check(n.YES))return this.advance(),{type:"BooleanLiteral",value:!0};if(this.check(n.NO))return this.advance(),{type:"BooleanLiteral",value:!1};if(this.check(n.LENGTH))return this.advance(),this.consume(n.OF,"Expected 'of' after 'length'"),{type:"LengthExpression",list:this.parseExpression()};if(this.check(n.RANDOM)){this.advance(),this.consume(n.NUMBER_KW,"Expected 'number' after 'random'"),this.consume(n.FROM,"Expected 'from' after 'random number'");const t=this.parseSimpleExpression();this.consume(n.TO,"Expected 'to' in 'random number from X to Y'");const i=this.parseSimpleExpression();return{type:"RandomExpression",min:t,max:i}}if(this.check(n.LIST)){this.advance(),this.consume(n.OF,"Expected 'of' after 'list'");const t=[];for(t.push(this.parseSimpleExpression());this.check(n.COMMA)||this.check(n.AND);)this.advance(),t.push(this.parseSimpleExpression());return{type:"ListLiteral",elements:t}}if(this.check(n.ITEM)){this.advance();const t=this.parseExpression();this.consume(n.OF,"Expected 'of' after item index");const i=this.parseExpression();return{type:"ItemAccess",index:t,list:i}}if(this.check(n.IDENTIFIER)){const t=this.advance();return this.check(n.WITH)?(this.current--,this.parseFunctionCallExpression()):{type:"Identifier",name:t.value}}const e=this.peek();throw new m(`I expected a value here but found '${e.value}'`,e.line,e.column)}check(e){return this.isAtEnd()?!1:this.peek().type===e}checkStatementStart(){return this.check(n.SET)||this.check(n.IF)||this.check(n.REPEAT)||this.check(n.FOR)||this.check(n.FUNCTION)||this.check(n.RETURN)||this.check(n.PRINT)||this.check(n.DRAW)||this.check(n.CLEAR)}advance(){return this.isAtEnd()||this.current++,this.previous()}isAtEnd(){return this.peek().type===n.EOF}peek(){return this.tokens[this.current]}peekNext(){return this.current+1>=this.tokens.length?null:this.tokens[this.current+1]}previous(){return this.tokens[this.current-1]}consume(e,t){if(this.check(e))return this.advance();const i=this.peek(),r=O(i.value,[e.toLowerCase()]),a=r?`Did you mean '${r}'?`:void 0;throw new m(t,i.line,i.column,a)}consumeOptionalComma(){this.check(n.COMMA)&&this.advance()}}function U(s){return new $(s).parse()}class k{constructor(e){this.value=e}}class P{constructor(e){this.globals=new Map,this.environment=this.globals,this.callbacks=e}async run(e){for(const t of e.statements)await this.executeStatement(t)}async executeStatement(e){switch(e.type){case"SetStatement":this.executeSetStatement(e);break;case"SetItemStatement":this.executeSetItemStatement(e);break;case"IfStatement":await this.executeIfStatement(e);break;case"RepeatTimesStatement":await this.executeRepeatTimesStatement(e);break;case"RepeatWhileStatement":await this.executeRepeatWhileStatement(e);break;case"ForEachStatement":await this.executeForEachStatement(e);break;case"FunctionDeclaration":this.executeFunctionDeclaration(e);break;case"FunctionCallStatement":await this.evaluateFunctionCall(e.call);break;case"ReturnStatement":this.executeReturnStatement(e);break;case"PrintStatement":this.executePrintStatement(e);break;case"DrawStatement":this.executeDrawStatement(e);break;case"SetColorStatement":this.executeSetColorStatement(e);break;case"ClearCanvasStatement":this.callbacks.clearCanvas();break;case"AskStatement":await this.executeAskStatement(e);break;default:throw new h(`Unknown statement type: ${e.type}`,0)}}executeSetStatement(e){const t=this.evaluate(e.value);this.environment.set(e.identifier,t)}executeSetItemStatement(e){const t=this.evaluate(e.index),i=this.evaluate(e.value),r=this.lookupVariable(e.list);if(typeof t!="number")throw new h(`The item number needs to be a number, but got ${typeof t}`,e.line);if(!Array.isArray(r))throw new h(`'${e.list}' is not a list`,e.line);const a=Math.floor(t)-1;if(a<0||a>=r.length)throw new h(`There is no item ${t} in this list. The list has ${r.length} item(s).`,e.line,1,`Valid item numbers are 1 to ${r.length}`);r[a]=i}async executeAskStatement(e){const t=this.stringify(this.evaluate(e.prompt)),i=await this.callbacks.ask(t),r=parseFloat(i);!isNaN(r)&&i.trim()!==""?this.environment.set(e.variable,r):this.environment.set(e.variable,i)}async executeIfStatement(e){const t=this.evaluate(e.condition);if(this.isTruthy(t))for(const i of e.thenBranch)await this.executeStatement(i);else if(e.elseBranch)for(const i of e.elseBranch)await this.executeStatement(i)}async executeRepeatTimesStatement(e){const t=this.evaluate(e.count);if(typeof t!="number")throw new h(`'repeat' needs a number, but got ${typeof t}`,e.line);for(let i=0;i<t;i++)for(const r of e.body)await this.executeStatement(r)}async executeRepeatWhileStatement(e){let t=0;const i=1e5;for(;this.isTruthy(this.evaluate(e.condition));){for(const r of e.body)await this.executeStatement(r);if(t++,t>i)throw new h("This loop has run too many times. There might be an infinite loop.",e.line,1,"Check that your loop condition will eventually become false")}}async executeForEachStatement(e){const t=this.evaluate(e.iterable);if(!Array.isArray(t))throw new h(`'for each' needs a list to loop over, but got ${typeof t}`,e.line);for(const i of t){this.environment.set(e.variable,i);for(const r of e.body)await this.executeStatement(r)}}executeFunctionDeclaration(e){const t={type:"function",name:e.name,parameters:e.parameters,body:e.body};this.globals.set(e.name,t)}executeReturnStatement(e){const t=e.value?this.evaluate(e.value):null;throw new k(t)}executePrintStatement(e){const t=this.evaluate(e.value);this.callbacks.print(this.stringify(t))}executeDrawStatement(e){const t=e.params;switch(e.shape){case"circle":{const i=this.evaluateNumber(t.x,"x",e.line),r=this.evaluateNumber(t.y,"y",e.line),a=this.evaluateNumber(t.radius,"radius",e.line);this.callbacks.drawCircle(i,r,a);break}case"rectangle":{const i=this.evaluateNumber(t.x,"x",e.line),r=this.evaluateNumber(t.y,"y",e.line),a=this.evaluateNumber(t.width,"width",e.line),c=this.evaluateNumber(t.height,"height",e.line);this.callbacks.drawRectangle(i,r,a,c);break}case"line":{const i=this.evaluateNumber(t.x1,"x1",e.line),r=this.evaluateNumber(t.y1,"y1",e.line),a=this.evaluateNumber(t.x2,"x2",e.line),c=this.evaluateNumber(t.y2,"y2",e.line);this.callbacks.drawLine(i,r,a,c);break}}}executeSetColorStatement(e){const t=this.evaluate(e.color);this.callbacks.setColor(String(t))}evaluate(e){switch(e.type){case"NumberLiteral":return e.value;case"StringLiteral":return e.value;case"BooleanLiteral":return e.value;case"Identifier":return this.lookupVariable(e.name);case"ListLiteral":return e.elements.map(t=>this.evaluate(t));case"ItemAccess":return this.evaluateItemAccess(e);case"BinaryExpression":return this.evaluateBinaryExpression(e);case"UnaryExpression":return this.evaluateUnaryExpression(e);case"ComparisonExpression":return this.evaluateComparisonExpression(e);case"JoinedExpression":return this.evaluateJoinedExpression(e);case"FunctionCallExpression":return this.evaluateFunctionCallSync(e);case"LengthExpression":return this.evaluateLengthExpression(e);case"RandomExpression":return this.evaluateRandomExpression(e);case"GroupedExpression":return this.evaluate(e.expression);default:throw new h(`Unknown expression type: ${e.type}`,0)}}lookupVariable(e){if(this.environment.has(e))return this.environment.get(e);if(this.globals.has(e))return this.globals.get(e);throw new h(`I don't know what '${e}' is. Did you forget to set it first?`,0,1,`Try adding: set ${e} to ...`)}evaluateItemAccess(e){const t=this.evaluate(e.index),i=this.evaluate(e.list);if(typeof t!="number")throw new h(`The item number needs to be a number, but got ${typeof t}`,0);if(!Array.isArray(i))throw new h(`'item' can only be used with lists, but got ${typeof i}`,0);const r=Math.floor(t)-1;if(r<0||r>=i.length)throw new h(`There is no item ${t} in this list. The list has ${i.length} item(s).`,0,1,`Valid item numbers are 1 to ${i.length}`);return i[r]}evaluateBinaryExpression(e){const t=this.evaluate(e.left),i=this.evaluate(e.right);switch(e.operator){case"plus":if(typeof t=="number"&&typeof i=="number")return t+i;if(typeof t=="string"||typeof i=="string")return String(t)+String(i);throw new h(`Cannot add ${typeof t} and ${typeof i}. Both sides need to be numbers.`,0);case"minus":if(typeof t=="number"&&typeof i=="number")return t-i;throw new h(`Cannot subtract ${typeof t} and ${typeof i}. Both sides need to be numbers.`,0);case"times":if(typeof t=="number"&&typeof i=="number")return t*i;throw new h(`Cannot multiply ${typeof t} and ${typeof i}. Both sides need to be numbers.`,0);case"divided by":if(typeof t=="number"&&typeof i=="number"){if(i===0)throw new h("Cannot divide by zero",0,1,"Division by zero is undefined in mathematics");return t/i}throw new h(`Cannot divide ${typeof t} by ${typeof i}. Both sides need to be numbers.`,0);case"mod":if(typeof t=="number"&&typeof i=="number")return t%i;throw new h(`Cannot use 'mod' with ${typeof t} and ${typeof i}. Both sides need to be numbers.`,0);case"and":return this.isTruthy(t)&&this.isTruthy(i);case"or":return this.isTruthy(t)||this.isTruthy(i);default:throw new h(`Unknown operator: ${e.operator}`,0)}}evaluateUnaryExpression(e){const t=this.evaluate(e.operand);switch(e.operator){case"not":return!this.isTruthy(t);case"minus":if(typeof t=="number")return-t;throw new h(`Cannot negate ${typeof t}. Expected a number.`,0);default:throw new h(`Unknown operator: ${e.operator}`,0)}}evaluateComparisonExpression(e){const t=this.evaluate(e.left),i=this.evaluate(e.right);switch(e.operator){case"equal to":return this.isEqual(t,i);case"not equal to":return!this.isEqual(t,i);case"greater than":if(typeof t=="number"&&typeof i=="number")return t>i;throw new h(`Cannot compare ${typeof t} and ${typeof i}. Both sides need to be numbers.`,0);case"less than":if(typeof t=="number"&&typeof i=="number")return t<i;throw new h(`Cannot compare ${typeof t} and ${typeof i}. Both sides need to be numbers.`,0);case"greater than or equal to":if(typeof t=="number"&&typeof i=="number")return t>=i;throw new h(`Cannot compare ${typeof t} and ${typeof i}. Both sides need to be numbers.`,0);case"less than or equal to":if(typeof t=="number"&&typeof i=="number")return t<=i;throw new h(`Cannot compare ${typeof t} and ${typeof i}. Both sides need to be numbers.`,0);default:throw new h(`Unknown comparison: ${e.operator}`,0)}}evaluateJoinedExpression(e){const t=this.evaluate(e.left),i=this.evaluate(e.right);return this.stringify(t)+this.stringify(i)}evaluateLengthExpression(e){const t=this.evaluate(e.list);if(typeof t=="string")return t.length;if(!Array.isArray(t))throw new h(`'length of' needs a list or text, but got ${typeof t}`,0);return t.length}evaluateRandomExpression(e){const t=this.evaluate(e.min),i=this.evaluate(e.max);if(typeof t!="number"||typeof i!="number")throw new h(`'random number from' needs two numbers, but got ${typeof t} and ${typeof i}`,0);return Math.floor(Math.random()*(i-t+1))+t}evaluateFunctionCallSync(e){const t=this.lookupVariable(e.name);if(!t||typeof t!="object"||t.type!=="function")throw new h(`'${e.name}' is not a function`,0,1,`Make sure you defined a function called '${e.name}'`);const i=t,r=e.arguments.map(o=>this.evaluate(o));if(r.length!==i.parameters.length)throw new h(`The function '${e.name}' needs ${i.parameters.length} value(s), but you gave it ${r.length}`,0);const a=this.environment;this.environment=new Map(this.globals);for(let o=0;o<i.parameters.length;o++)this.environment.set(i.parameters[o],r[o]);let c=null;try{for(const o of i.body)this.executeStatementSync(o)}catch(o){if(o instanceof k)c=o.value;else throw o}return this.environment=a,c}async evaluateFunctionCall(e){const t=this.lookupVariable(e.name);if(!t||typeof t!="object"||t.type!=="function")throw new h(`'${e.name}' is not a function`,0,1,`Make sure you defined a function called '${e.name}'`);const i=t,r=e.arguments.map(o=>this.evaluate(o));if(r.length!==i.parameters.length)throw new h(`The function '${e.name}' needs ${i.parameters.length} value(s), but you gave it ${r.length}`,0);const a=this.environment;this.environment=new Map(this.globals);for(let o=0;o<i.parameters.length;o++)this.environment.set(i.parameters[o],r[o]);let c=null;try{for(const o of i.body)await this.executeStatement(o)}catch(o){if(o instanceof k)c=o.value;else throw o}return this.environment=a,c}executeStatementSync(e){switch(e.type){case"SetStatement":this.executeSetStatement(e);break;case"SetItemStatement":this.executeSetItemStatement(e);break;case"IfStatement":this.executeIfStatementSync(e);break;case"RepeatTimesStatement":this.executeRepeatTimesStatementSync(e);break;case"RepeatWhileStatement":this.executeRepeatWhileStatementSync(e);break;case"ForEachStatement":this.executeForEachStatementSync(e);break;case"FunctionDeclaration":this.executeFunctionDeclaration(e);break;case"FunctionCallStatement":this.evaluateFunctionCallSync(e.call);break;case"ReturnStatement":this.executeReturnStatement(e);break;case"PrintStatement":this.executePrintStatement(e);break;case"DrawStatement":this.executeDrawStatement(e);break;case"SetColorStatement":this.executeSetColorStatement(e);break;case"ClearCanvasStatement":this.callbacks.clearCanvas();break;case"AskStatement":throw new h("'ask' cannot be used inside a function that returns a value. Call the function as a statement instead.",e.line);default:throw new h(`Unknown statement type: ${e.type}`,0)}}executeIfStatementSync(e){const t=this.evaluate(e.condition);if(this.isTruthy(t))for(const i of e.thenBranch)this.executeStatementSync(i);else if(e.elseBranch)for(const i of e.elseBranch)this.executeStatementSync(i)}executeRepeatTimesStatementSync(e){const t=this.evaluate(e.count);if(typeof t!="number")throw new h(`'repeat' needs a number, but got ${typeof t}`,e.line);for(let i=0;i<t;i++)for(const r of e.body)this.executeStatementSync(r)}executeRepeatWhileStatementSync(e){let t=0;const i=1e5;for(;this.isTruthy(this.evaluate(e.condition));){for(const r of e.body)this.executeStatementSync(r);if(t++,t>i)throw new h("This loop has run too many times.",e.line)}}executeForEachStatementSync(e){const t=this.evaluate(e.iterable);if(!Array.isArray(t))throw new h(`'for each' needs a list, but got ${typeof t}`,e.line);for(const i of t){this.environment.set(e.variable,i);for(const r of e.body)this.executeStatementSync(r)}}evaluateNumber(e,t,i){const r=this.evaluate(e);if(typeof r!="number")throw new h(`'${t}' needs to be a number, but got ${typeof r}`,i);return r}isTruthy(e){return e===null?!1:typeof e=="boolean"?e:!0}isEqual(e,t){return e===null&&t===null?!0:e===null||t===null?!1:Array.isArray(e)&&Array.isArray(t)?e.length!==t.length?!1:e.every((i,r)=>this.isEqual(i,t[r])):e===t}stringify(e){return e===null?"nothing":typeof e=="boolean"?e?"yes":"no":Array.isArray(e)?"list of "+e.map(t=>this.stringify(t)).join(", "):typeof e=="object"&&e.type==="function"?`function ${e.name}`:String(e)}}function j(s){return new P(s)}async function H(s,e){try{const t=B(s),i=U(t);return await j(e).run(i),{success:!0}}catch(t){if(t instanceof g)return{success:!1,error:{message:t.message,line:t.line,column:t.column,formatted:t.format(s)}};throw t}}const q=["set","to","if","then","else","end","function","taking","with","repeat","times","while","for","each","in","do","return","and","or","not","is","equal","greater","less","than","plus","minus","divided","by","mod","joined","list","of","item","length","random","number","from","ask","store"],W=["print","draw","circle","rectangle","line","at","radius","width","height","color","clear","canvas"],_=["yes","no"];function u(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function G(s){return s.split(`
`).map(i=>{const r=i.match(/^(\s*)(note:)(.*)$/i);if(r){const[,o,l,E]=r;return`${u(o)}<span class="hl-comment">${u(l)}${u(E)}</span>`}let a="",c=0;for(;c<i.length;){if(i[c]==='"'){let o=c+1;for(;o<i.length&&i[o]!=='"';)o++;const l=i.slice(c,o+1);a+=`<span class="hl-string">${u(l)}</span>`,c=o+1;continue}if(/\d/.test(i[c])){let o=c;for(;o<i.length&&/[\d.]/.test(i[o]);)o++;const l=i.slice(c,o);a+=`<span class="hl-number">${u(l)}</span>`,c=o;continue}if(/[a-zA-Z_]/.test(i[c])){let o=c;for(;o<i.length&&/[a-zA-Z0-9_]/.test(i[o]);)o++;const l=i.slice(c,o),E=l.toLowerCase();_.includes(E)?a+=`<span class="hl-boolean">${u(l)}</span>`:q.includes(E)?a+=`<span class="hl-keyword">${u(l)}</span>`:W.includes(E)?a+=`<span class="hl-builtin">${u(l)}</span>`:a+=u(l),c=o;continue}a+=u(i[c]),c++}return a}).join(`
`)}const A={hello:`note: Welcome to Gently!
note: This is a simple Hello World program

print "Hello, World!"
print "Welcome to Gently programming language"

set name to "Friend"
print "Nice to meet you, " joined with name`,math:`note: Basic math operations in Gently

set a to 10
set b to 3

print "Math with " joined with a joined with " and " joined with b

set sum to a plus b
print "Sum: " joined with sum

set difference to a minus b
print "Difference: " joined with difference

set product to a times b
print "Product: " joined with product

set quotient to a divided by b
print "Quotient: " joined with quotient

set remainder to a mod b
print "Remainder: " joined with remainder

note: You can also use symbols
set result to 5 + 3 * 2
print "5 + 3 * 2 = " joined with result`,loops:`note: Different types of loops in Gently

print "Counting to 5:"
set counter to 1
repeat 5 times
    print counter
    set counter to counter plus 1
end repeat

print ""
print "Using a list:"
set fruits to list of "apple", "banana", "cherry"
for each fruit in fruits do
    print "I like " joined with fruit
end for

print ""
print "Countdown:"
set n to 5
repeat while n is greater than 0
    print n
    set n to n minus 1
end repeat
print "Blast off!"`,drawing:`note: Drawing shapes on the canvas
note: Click the "Canvas" tab to see the output!

clear canvas

note: Draw a blue sky
set color to "lightblue"
draw rectangle at 0, 0 with width 400 and height 200

note: Draw the sun
set color to "yellow"
draw circle at 350, 50 with radius 40

note: Draw grass
set color to "green"
draw rectangle at 0, 200 with width 400 and height 100

note: Draw a house
set color to "brown"
draw rectangle at 150, 120 with width 100 and height 80

note: Draw a roof
set color to "darkred"
draw line from 140, 120 to 200, 70
draw line from 200, 70 to 260, 120

note: Draw a door
set color to "saddlebrown"
draw rectangle at 185, 150 with width 30 and height 50

print "Drew a house scene!"
print "Click the Canvas tab to see it."`,function:`note: Functions in Gently

note: A simple greeting function
function greet taking name
    print "Hello, " joined with name joined with "!"
end function

greet with "Alice"
greet with "Bob"

note: A function that returns a value
function add taking a b
    return a plus b
end function

set result to add with 5 and 3
print "5 + 3 = " joined with result

note: A function to check if a number is even
function is_even taking number
    set remainder to number mod 2
    if remainder is equal to 0 then
        return yes
    end if
    return no
end function

set num to 4
if is_even with num then
    print num joined with " is even"
else
    print num joined with " is odd"
end if`,fibonacci:`note: Fibonacci sequence
note: Tests: recursion, functions returning values, conditionals

function fib taking n
    if n is less than or equal to 1 then
        return n
    end if
    set a to fib with n minus 1
    set b to fib with n minus 2
    return a plus b
end function

print "Fibonacci sequence:"
set i to 0
repeat 10 times
    set result to fib with i
    print "fib(" joined with i joined with ") = " joined with result
    set i to i plus 1
end repeat`,fizzbuzz:`note: FizzBuzz
note: Tests: modulo, conditionals, loops, nested logic

print "FizzBuzz from 1 to 20:"
print ""

set n to 1
repeat 20 times
    set by3 to n mod 3
    set by5 to n mod 5

    if by3 is equal to 0 and by5 is equal to 0 then
        print "FizzBuzz"
    else if by3 is equal to 0 then
        print "Fizz"
    else if by5 is equal to 0 then
        print "Buzz"
    else
        print n
    end if

    set n to n plus 1
end repeat`,factorial:`note: Factorial calculator
note: Tests: recursion, multiplication, base cases

function factorial taking n
    if n is less than or equal to 1 then
        return 1
    end if
    set prev to factorial with n minus 1
    return n times prev
end function

print "Factorials:"
set i to 0
repeat 8 times
    set result to factorial with i
    print i joined with "! = " joined with result
    set i to i plus 1
end repeat`,lists:`note: List operations
note: Tests: lists, for-each, item access, list length

set numbers to list of 10, 25, 5, 30, 15

note: Print all items
print "Numbers in list:"
for each num in numbers do
    print num
end for

note: Calculate sum
print ""
print "Calculating sum..."
set total to 0
for each num in numbers do
    set total to total plus num
end for
print "Sum: " joined with total

note: Find the largest
print ""
print "Finding largest..."
set largest to item 1 of numbers
for each num in numbers do
    if num is greater than largest then
        set largest to num
    end if
end for
print "Largest: " joined with largest

note: Find the smallest
print ""
print "Finding smallest..."
set smallest to item 1 of numbers
for each num in numbers do
    if num is less than smallest then
        set smallest to num
    end if
end for
print "Smallest: " joined with smallest`,primes:`note: Prime number checker
note: Tests: nested logic, early returns, modulo

function is_prime taking n
    if n is less than 2 then
        return no
    end if
    if n is equal to 2 then
        return yes
    end if
    if n mod 2 is equal to 0 then
        return no
    end if

    note: Check odd divisors up to square root approximation
    set divisor to 3
    repeat while divisor times divisor is less than or equal to n
        if n mod divisor is equal to 0 then
            return no
        end if
        set divisor to divisor plus 2
    end repeat

    return yes
end function

print "Prime numbers from 1 to 30:"
set n to 1
repeat 30 times
    if is_prime with n then
        print n joined with " is prime"
    end if
    set n to n plus 1
end repeat`,temperature:`note: Temperature converter
note: Tests: functions with calculations, decimal numbers

function celsius_to_fahrenheit taking c
    return c times 9 divided by 5 plus 32
end function

function fahrenheit_to_celsius taking f
    note: Need to subtract first, then multiply
    set adjusted to f minus 32
    return adjusted times 5 divided by 9
end function

print "Temperature Conversions:"
print ""

set temps to list of 0, 20, 37, 100

print "Celsius to Fahrenheit:"
for each c in temps do
    set f to celsius_to_fahrenheit with c
    print c joined with "C = " joined with f joined with "F"
end for

print ""
print "Fahrenheit to Celsius:"
set ftemps to list of 32, 68, 98.6, 212
for each f in ftemps do
    set c to fahrenheit_to_celsius with f
    print f joined with "F = " joined with c joined with "C"
end for`,multiplication:`note: Nested loops - multiplication table
note: Tests: nested repeat, string building

print "Multiplication Table (1-5):"
print ""

set row to 1
repeat 5 times
    set col to 1
    set row_text to ""
    repeat 5 times
        set product to row times col
        set row_text to row_text joined with product joined with "  "
        set col to col plus 1
    end repeat
    print row_text
    set row to row plus 1
end repeat`,patterns:`note: Drawing patterns
note: Tests: drawing commands, math in coordinates, loops with graphics

clear canvas

note: Draw a row of circles with different colors
set x to 30
set colors to list of "red", "orange", "yellow", "green", "blue", "purple"
set i to 1

repeat 6 times
    set clr to item i of colors
    set color to clr
    draw circle at x, 50 with radius 20
    set x to x plus 60
    set i to i plus 1
end repeat

note: Draw a grid of rectangles
set y to 100
set color to "gray"
repeat 4 times
    set x to 20
    repeat 6 times
        draw rectangle at x, y with width 50 and height 40
        set x to x plus 60
    end repeat
    set y to y plus 50
end repeat

note: Draw diagonal lines
set color to "black"
set i to 0
repeat 8 times
    set startx to i times 50
    draw line from startx, 0 to 400, 300 minus startx
    set i to i plus 1
end repeat

print "Pattern complete! Click Canvas tab to see."`,sierpinski:`note: Sierpinski Triangle using the Chaos Game algorithm
note: This creates a fractal by repeatedly moving halfway toward random vertices

clear canvas

note: Define the three vertices of the triangle
set x1 to 200
set y1 to 10
set x2 to 10
set y2 to 290
set x3 to 390
set y3 to 290

note: Start at a random point inside the triangle
set x to 200
set y to 150

note: Draw the fractal using the chaos game
set color to "purple"
set i to 0
repeat 5000 times
    note: Pick a random vertex (1, 2, or 3)
    set vertex to random number from 1 to 3

    note: Move halfway toward the chosen vertex
    if vertex is equal to 1 then
        set x to (x plus x1) divided by 2
        set y to (y plus y1) divided by 2
    end if
    if vertex is equal to 2 then
        set x to (x plus x2) divided by 2
        set y to (y plus y2) divided by 2
    end if
    if vertex is equal to 3 then
        set x to (x plus x3) divided by 2
        set y to (y plus y3) divided by 2
    end if

    note: Draw a tiny dot at the current position
    note: Skip first few iterations to let the pattern stabilize
    if i is greater than 10 then
        draw circle at x, y with radius 1
    end if

    set i to i plus 1
end repeat

print "Sierpinski Triangle complete!"
print "Click the Canvas tab to see the fractal."`,guessnumber:`note: Guess the Number Game
note: This demonstrates user input with the "ask" statement

print "Welcome to Guess the Number!"
print ""

note: Generate a secret number between 1 and 100
set secret to random number from 1 to 100
set guesses to 0
set won to no

print "I'm thinking of a number between 1 and 100."
print "You have 7 tries to guess it!"
print ""

note: Give the player 7 attempts
repeat 7 times
    if won is equal to no then
        ask "Enter your guess:" and store in guess
        set guesses to guesses plus 1

        if guess is equal to secret then
            set won to yes
            print "Congratulations! You got it!"
            print "The number was " joined with secret
            print "You guessed it in " joined with guesses joined with " tries!"
        else if guess is less than secret then
            print guess joined with " is too low. Try higher!"
        else
            print guess joined with " is too high. Try lower!"
        end if
        print ""
    end if
end repeat

if won is equal to no then
    print "Game over! The number was " joined with secret
    print "Better luck next time!"
end if`,newfeatures:`note: Test new language features

note: Test parentheses for grouping
set a to 2
set b to 3
set c to 4
set result1 to (a plus b) times c
set result2 to a plus (b times c)
print "2 + 3 then * 4 = " joined with result1
print "2 + (3 * 4) = " joined with result2

note: Test else if
set score to 75
if score is greater than 90 then
    print "Grade: A"
else if score is greater than 80 then
    print "Grade: B"
else if score is greater than 70 then
    print "Grade: C"
else
    print "Grade: D"
end if

note: Test length of list
set items to list of "apple", "banana", "cherry"
set count to length of items
print "List has " joined with count joined with " items"

note: Test set item of list
print "Original first item: " joined with item 1 of items
set item 1 of items to "avocado"
print "Changed first item: " joined with item 1 of items

note: Test random number
set dice1 to random number from 1 to 6
set dice2 to random number from 1 to 6
print "Dice roll: " joined with dice1 joined with " and " joined with dice2

note: Test length of string
set message to "Hello World"
set msgLen to length of message
print "String '" joined with message joined with "' has " joined with msgLen joined with " characters"`},d=document.getElementById("editor"),V=document.getElementById("highlight-code"),C=document.getElementById("highlight-layer"),p=document.getElementById("output"),f=document.getElementById("canvas"),w=document.getElementById("run-btn"),I=document.getElementById("examples"),b=document.getElementById("error"),z=document.getElementById("help-btn"),v=document.getElementById("guide-modal"),Y=document.getElementById("close-modal"),S=document.getElementById("input-container"),K=document.getElementById("input-prompt"),x=document.getElementById("input-field"),L=document.querySelectorAll(".tab"),J=document.querySelectorAll(".panel");let y=null,N=!1;function R(){const s=d.value;V.innerHTML=G(s)+`
`}function Q(){C.scrollTop=d.scrollTop,C.scrollLeft=d.scrollLeft}L.forEach(s=>{s.addEventListener("click",()=>{var t;const e=s.getAttribute("data-tab");L.forEach(i=>i.classList.remove("active")),J.forEach(i=>i.classList.remove("active")),s.classList.add("active"),(t=document.getElementById(`${e}-panel`))==null||t.classList.add("active")})});I.addEventListener("change",()=>{const s=I.value;s&&A[s]&&(d.value=A[s],I.value="",R())});d.addEventListener("input",R);d.addEventListener("scroll",Q);z.addEventListener("click",()=>{v.classList.remove("hidden")});Y.addEventListener("click",()=>{v.classList.add("hidden")});v.addEventListener("click",s=>{s.target===v&&v.classList.add("hidden")});function Z(){const s=f.getContext("2d");let e="black";return{print(t){const i=document.createElement("div");i.textContent=t,p.appendChild(i),p.scrollTop=p.scrollHeight},drawCircle(t,i,r){s.beginPath(),s.arc(t,i,r,0,Math.PI*2),s.fillStyle=e,s.fill()},drawRectangle(t,i,r,a){s.fillStyle=e,s.fillRect(t,i,r,a)},drawLine(t,i,r,a){s.beginPath(),s.moveTo(t,i),s.lineTo(r,a),s.strokeStyle=e,s.lineWidth=2,s.stroke()},setColor(t){e=t},clearCanvas(){s.clearRect(0,0,f.width,f.height)},ask(t){return new Promise(i=>{const r=document.createElement("div");r.textContent=t,r.style.color="#56b6c2",p.appendChild(r),K.textContent=">",x.value="",S.classList.remove("hidden"),x.focus(),y=a=>{S.classList.add("hidden");const c=document.createElement("div");c.textContent=`> ${a}`,c.style.color="#98c379",p.appendChild(c),p.scrollTop=p.scrollHeight,i(a)}})}}}x.addEventListener("keydown",s=>{if(s.key==="Enter"&&y){s.preventDefault();const e=x.value;y(e),y=null}});async function D(){if(N)return;p.innerHTML="",b.classList.add("hidden"),b.textContent="",S.classList.add("hidden"),f.getContext("2d").clearRect(0,0,f.width,f.height);const e=d.value;if(e.trim()){N=!0,w.disabled=!0,w.textContent="Running...";try{const t=Z(),i=await H(e,t);!i.success&&i.error&&(b.textContent=i.error.formatted,b.classList.remove("hidden"))}finally{N=!1,w.disabled=!1,w.textContent="Run",S.classList.add("hidden"),y=null}}}w.addEventListener("click",D);d.addEventListener("keydown",s=>{(s.ctrlKey||s.metaKey)&&s.key==="Enter"&&(s.preventDefault(),D())});d.value=A.hello;R();
