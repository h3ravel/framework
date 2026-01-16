import { Model } from '@h3ravel/database'
import { User } from './user'

export class Project extends Model {
    protected table: string | null = 'projects'

    relationUser () {
        return this.belongsTo(User, 'user_id')
    }
}
