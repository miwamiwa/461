using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class pointHandler : MonoBehaviour
{
    Vector2 lastMousePos = new Vector2(-99f, -99f);
    Vector2 screensize;
    // Start is called before the first frame update
    void Start()
    {
        screensize = new Vector2(Screen.width, Screen.height);
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    private void OnMouseDrag()
    {
        Debug.Log("dragged!");
        Vector2 pos = new Vector2(
             scale(Input.mousePosition.x, 0f, screensize.x, -7.5f, 7.5f),
             scale(Input.mousePosition.y, 0f, screensize.y, 1.5f, 13f)
            );
        if (lastMousePos.x != -99f && lastMousePos.y != -99f)
        {
            transform.position = new Vector2(
                   transform.position.x + pos.x - lastMousePos.x,
                   transform.position.y + pos.y - lastMousePos.y
                );
        }
        lastMousePos.x = pos.x;
        lastMousePos.y = pos.y;
    }

    float scale(float input, float oldMin, float oldMax, float newMin, float newMax)
    {
        float result = newMin+(newMax-newMin)*((input - oldMin) / (oldMax - oldMin));
        return result;
    }
}
