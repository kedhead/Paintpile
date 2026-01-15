import { BaseAIPaintSetGenerator } from './ai-paint-set-generator';

export class CitadelAIGenerator extends BaseAIPaintSetGenerator {
    protected brandName = 'Citadel (Games Workshop)';
}

export class ArmyPainterAIGenerator extends BaseAIPaintSetGenerator {
    protected brandName = 'The Army Painter';
}

export class VallejoAIGenerator extends BaseAIPaintSetGenerator {
    protected brandName = 'Vallejo';
}

export class MonumentAIGenerator extends BaseAIPaintSetGenerator {
    protected brandName = 'Monument Hobbies';
}
