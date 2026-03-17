use turncheckpoint to avoid playing all the animations on reload
add support for skipping animations for all actions on client side


so reload or desync flow is 
FULL_SEND -> turn_checkpoint present? -> yes -> apply turn_checkpoint state -> skip animations till turn_checkpoint -> apply actions after turn_checkpoint -> done 
                                    | -> no  -> apply all animations -> done