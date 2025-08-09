import { Route, Get, Path } from 'tsoa';

@Route('hello')
export class HelloController {
    @Get('{name}')
    public async getHello(@Path() name: string): Promise<string> {
        return `Hello ${name}`;
    }
}
