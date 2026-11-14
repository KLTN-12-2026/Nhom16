import type { CvJobComparison, JdAnalysis } from '../../../apis/ai'
export const AI_ACTIONS = { JD_LIST_REQUESTED:'ai/JD_LIST_REQUESTED', JD_LIST_SUCCEEDED:'ai/JD_LIST_SUCCEEDED', JD_REQUESTED:'ai/JD_REQUESTED', JD_UPDATED:'ai/JD_UPDATED', MATCH_LIST_REQUESTED:'ai/MATCH_LIST_REQUESTED', MATCH_LIST_SUCCEEDED:'ai/MATCH_LIST_SUCCEEDED', MATCH_REQUESTED:'ai/MATCH_REQUESTED', MATCH_UPDATED:'ai/MATCH_UPDATED', MATCH_DELETE_REQUESTED:'ai/MATCH_DELETE_REQUESTED', MATCH_DELETED:'ai/MATCH_DELETED', FAILED:'ai/FAILED' } as const
interface State { jdAnalyses: JdAnalysis[]; comparisons: CvJobComparison[]; loading: boolean; processing: boolean; error: string|null }
const initial: State = { jdAnalyses: [], comparisons: [], loading: false, processing: false, error: null }
export const recruitmentAiActions = {
  listJd: () => ({ type: AI_ACTIONS.JD_LIST_REQUESTED }), requestJd: (jobId:number, force=false) => ({ type: AI_ACTIONS.JD_REQUESTED, payload:{jobId,force} }),
  listMatches: () => ({ type: AI_ACTIONS.MATCH_LIST_REQUESTED }), requestMatch: (cvId:number, jobId:number, force=false) => ({ type: AI_ACTIONS.MATCH_REQUESTED, payload:{cvId,jobId,force} }), deleteMatch: (id:number) => ({ type: AI_ACTIONS.MATCH_DELETE_REQUESTED, payload:{id} }),
}
export function recruitmentAiReducer(state=initial, action:any):State {
  switch(action.type) {
    case AI_ACTIONS.JD_LIST_REQUESTED: case AI_ACTIONS.MATCH_LIST_REQUESTED: return {...state,loading:true,error:null}
    case AI_ACTIONS.JD_REQUESTED: case AI_ACTIONS.MATCH_REQUESTED: return {...state,processing:true,error:null}
    case AI_ACTIONS.JD_LIST_SUCCEEDED: return {...state,loading:false,jdAnalyses:action.payload}
    case AI_ACTIONS.MATCH_LIST_SUCCEEDED: return {...state,loading:false,comparisons:action.payload}
    case AI_ACTIONS.JD_UPDATED: return {...state,processing:['PENDING','PROCESSING'].includes(action.payload.status),jdAnalyses:[action.payload,...state.jdAnalyses.filter((x:JdAnalysis)=>x.id!==action.payload.id)]}
    case AI_ACTIONS.MATCH_UPDATED: return {...state,processing:['PENDING','PROCESSING'].includes(action.payload.status),comparisons:[action.payload,...state.comparisons.filter((x:CvJobComparison)=>x.id!==action.payload.id)]}
    case AI_ACTIONS.MATCH_DELETE_REQUESTED: return {...state,processing:true,error:null}
    case AI_ACTIONS.MATCH_DELETED: return {...state,processing:false,comparisons:state.comparisons.filter((x:CvJobComparison)=>x.id!==action.payload.id)}
    case AI_ACTIONS.FAILED: return {...state,loading:false,processing:false,error:action.payload}
    default:return state
  }
}
