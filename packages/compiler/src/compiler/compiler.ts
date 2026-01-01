import { Lexer } from "../lexer/lexer";
import { TokenType } from "../lexer/models/token-type.enum";

function compile(input: string): void {
  const tokens = new Lexer(input).tokenize();

  const mappedTokens = tokens.map(token => {
    const { type, ...rest } = token;
    const mappedToken: { type: string, parts: string[] } = { ...rest, type: '' };

    switch (type) {
      case TokenType.TEXT:
        mappedToken.type = 'text'
        break;
      case TokenType.ATTRIBUTE:
        mappedToken.type = 'attribute' as any
        break;
      case TokenType.EVENT:
        mappedToken.type = 'event' as any;
        break;
      case TokenType.TAG_SELF_CLOSE:
        mappedToken.type = 'self-close' as any;
        break;
      case TokenType.TAG_OPEN_NAME:
        mappedToken.type = 'open-name' as any;
        break;
      case TokenType.TAG_CLOSE_NAME:
        mappedToken.type = 'close-name' as any
        break;
    }
    return mappedToken;
  });

  console.log(mappedTokens);
}

const template = `
<sp$a£n@ asd@ciao test="ciao" @click="onClick()" @suck="myDick()" />
<div dick>
  Text
</ div>
`
compile(template);